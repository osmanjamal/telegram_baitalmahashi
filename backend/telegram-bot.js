const { Telegraf, Markup } = require('telegraf');
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

// استيراد خدمات ونماذج
const User = require('./models/User.model');
const MenuItem = require('./models/MenuItem.model');
const Category = require('./models/Category.model');
const Order = require('./models/Order.model');
const NotificationService = require('./services/notification.service');

// تهيئة البوت باستخدام رمز من متغيرات البيئة
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// معالجة أمر البداية
bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    // البحث عن المستخدم أو إنشاء واحد جديد
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      user = new User({
        telegramId,
        name: ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : ''),
        username: ctx.from.username
      });
      await user.save();
      console.log(`👤 مستخدم جديد مسجل: ${user.name} (${telegramId})`);
    }
    
    // إرسال رسالة ترحيب مع لوحة المفاتيح الرئيسية
    await ctx.reply(
      `أهلاً بك في بيت المحاشي ${ctx.from.first_name}! 🍲\n` +
      `نحن سعداء بتقديم أشهى وجبات المحاشي الشرقية لك.`,
      Markup.keyboard([
        ['🍽️ قائمة الطعام', '🛒 سلة المشتريات'],
        ['📱 حسابي', '📜 طلباتي السابقة'],
        ['📞 اتصل بنا', '🏠 فروعنا']
      ]).resize()
    );
  } catch (error) {
    console.error('خطأ في أمر البداية:', error);
    ctx.reply('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى لاحقاً.');
  }
});

// معالجة قائمة الطعام
bot.hears('🍽️ قائمة الطعام', async (ctx) => {
  try {
    // البحث عن فئات الطعام
    const categories = await Category.find().sort('order');
    
    const categoryButtons = [];
    for (const category of categories) {
      categoryButtons.push([Markup.button.callback(category.name, `category_${category._id}`)]);
    }
    
    // إضافة زر العودة
    categoryButtons.push([Markup.button.callback('🔙 العودة للقائمة الرئيسية', 'back_to_main')]);
    
    await ctx.reply(
      'اختر من قائمة أطباقنا الشهية:',
      Markup.inlineKeyboard(categoryButtons)
    );
  } catch (error) {
    console.error('خطأ في عرض قائمة الطعام:', error);
    ctx.reply('عذراً، حدث خطأ في عرض القائمة. يرجى المحاولة مرة أخرى لاحقاً.');
  }
});

// معالجة الاختيار من ضمن الفئات
bot.action(/category_(.+)/, async (ctx) => {
  try {
    const categoryId = ctx.match[1];
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return ctx.answerCbQuery('فئة غير موجودة');
    }
    
    // البحث عن عناصر القائمة ضمن الفئة المحددة
    const menuItems = await MenuItem.find({ 
      category: categoryId,
      available: true 
    });
    
    if (menuItems.length === 0) {
      await ctx.answerCbQuery();
      return ctx.reply('لا توجد أطباق متاحة في هذه الفئة حالياً.');
    }
    
    await ctx.answerCbQuery();
    
    // إرسال كل طبق كرسالة منفصلة مع صورة وأزرار
    for (const item of menuItems) {
      const itemButtons = Markup.inlineKeyboard([
        [
          Markup.button.callback(`🛒 أضف للسلة (${item.price} ريال)`, `add_to_cart_${item._id}`),
          Markup.button.callback('ℹ️ التفاصيل', `item_details_${item._id}`)
        ]
      ]);
      
      // إرسال صورة الطبق إذا كانت متوفرة
      if (item.image) {
        await ctx.replyWithPhoto({ url: item.image }, {
          caption: `*${item.name}*\n${item.description}`,
          parse_mode: 'Markdown',
          ...itemButtons
        });
      } else {
        await ctx.reply(
          `*${item.name}*\n${item.description}\nالسعر: ${item.price} ريال`,
          {
            parse_mode: 'Markdown',
            ...itemButtons
          }
        );
      }
    }
    
    // إضافة زر العودة للفئات
    await ctx.reply(
      'اختر طبقاً آخر أو عد للفئات:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 العودة للفئات', 'back_to_categories')]
      ])
    );
  } catch (error) {
    console.error('خطأ في عرض عناصر الفئة:', error);
    ctx.reply('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى لاحقاً.');
  }
});

// معالجة طلبات العودة للقائمة الرئيسية
bot.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  
  await ctx.reply(
    'القائمة الرئيسية:',
    Markup.keyboard([
      ['🍽️ قائمة الطعام', '🛒 سلة المشتريات'],
      ['📱 حسابي', '📜 طلباتي السابقة'],
      ['📞 اتصل بنا', '🏠 فروعنا']
    ]).resize()
  );
});

// المزيد من معالجات الأحداث...


// طلباتي السابقة
bot.hears('📜 طلباتي السابقة', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return ctx.reply('يرجى التسجيل أولاً باستخدام أمر /start');
    }
    
    // البحث عن الطلبات السابقة للمستخدم
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.menuItem');
    
    if (orders.length === 0) {
      return ctx.reply('لا توجد طلبات سابقة.');
    }
    
    // إرسال قائمة بالطلبات السابقة
    for (const order of orders) {
      let orderText = `🧾 *طلب #${order._id.toString().slice(-6)}*\n`;
      orderText += `📅 التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-SA')}\n`;
      orderText += `⏱️ الحالة: ${getOrderStatusInArabic(order.status)}\n\n`;
      
      orderText += '🍽️ العناصر:\n';
      for (const item of order.items) {
        const menuItem = item.menuItem;
        orderText += `- ${item.quantity}x ${menuItem ? menuItem.name : 'عنصر محذوف'}`;
        
        // إضافة سعر العنصر
        if (item.price) {
          orderText += ` (${item.price} ريال)`;
        }
        
        // إضافة الخيارات المحددة إن وجدت
        if (item.options && item.options.length > 0) {
          orderText += `\n  الخيارات: ${item.options.map(opt => `${opt.name}: ${opt.choice}`).join(', ')}`;
        }
        
        // إضافة تعليمات خاصة إن وجدت
        if (item.specialInstructions) {
          orderText += `\n  ملاحظات: ${item.specialInstructions}`;
        }
        
        orderText += '\n';
      }
      
      // إضافة معلومات التوصيل
      orderText += `\n🚚 طريقة التوصيل: ${order.deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من المطعم'}`;
      
      // إضافة معلومات الدفع
      orderText += `\n💰 طريقة الدفع: ${getPaymentMethodInArabic(order.paymentMethod)}`;
      orderText += `\n💵 الإجمالي: ${order.totalPrice} ريال`;
      
      // إضافة عنوان التوصيل إذا كان طلب توصيل
      if (order.deliveryMethod === 'delivery' && order.deliveryAddress) {
        orderText += `\n📍 عنوان التوصيل: ${order.deliveryAddress.address || 'غير محدد'}`;
      }
      
      // إضافة وقت التوصيل/الاستلام المتوقع إذا كان متاحاً
      if (order.estimatedPreparationTime) {
        const estimatedTime = new Date(order.estimatedPreparationTime);
        orderText += `\n⏰ الوقت المتوقع: ${estimatedTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // إضافة أزرار التفاعل
      const orderButtons = [];
      
      // زر عرض التفاصيل
      orderButtons.push(Markup.button.callback('🔍 تفاصيل الطلب', `order_details_${order._id}`));
      
      // زر تتبع الطلب إذا كان قيد التوصيل
      if (order.status === 'out-for-delivery') {
        orderButtons.push(Markup.button.callback('📍 تتبع الطلب', `track_order_${order._id}`));
      }
      
      // زر إعادة الطلب
      orderButtons.push(Markup.button.callback('🔄 إعادة الطلب', `reorder_${order._id}`));
      
      // زر التقييم إذا تم تسليم الطلب ولم يتم تقييمه
      if ((order.status === 'delivered' || order.status === 'picked-up') && !order.ratings) {
        orderButtons.push(Markup.button.callback('⭐ تقييم الطلب', `rate_order_${order._id}`));
      }
      
      // تقسيم الأزرار إلى صفوف
      const inlineKeyboard = [];
      for (let i = 0; i < orderButtons.length; i += 2) {
        const row = [];
        row.push(orderButtons[i]);
        if (i + 1 < orderButtons.length) {
          row.push(orderButtons[i + 1]);
        }
        inlineKeyboard.push(row);
      }
      
      // إرسال الرسالة مع الأزرار
      await ctx.reply(orderText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(inlineKeyboard)
      });
    }
    
    // إضافة زر العودة للقائمة الرئيسية
    await ctx.reply(
      'للعودة إلى القائمة الرئيسية:',
      Markup.keyboard([
        ['🍽️ قائمة الطعام', '🛒 سلة المشتريات'],
        ['📱 حسابي', '📜 طلباتي السابقة'],
        ['📞 اتصل بنا', '🏠 فروعنا']
      ]).resize()
    );
  } catch (error) {
    console.error('خطأ في عرض الطلبات السابقة:', error);
    ctx.reply('عذراً، حدث خطأ أثناء جلب الطلبات السابقة. يرجى المحاولة مرة أخرى لاحقاً.');
  }
});

// معالجة الضغط على زر تفاصيل الطلب
bot.action(/order_details_(.+)/, async (ctx) => {
  try {
    const orderId = ctx.match[1];
    const telegramId = ctx.from.id.toString();
    
    // التحقق من وجود المستخدم
    const user = await User.findOne({ telegramId });
    if (!user) {
      return ctx.answerCbQuery('يرجى التسجيل أولاً');
    }
    
    // البحث عن الطلب
    const order = await Order.findOne({
      _id: orderId,
      user: user._id
    }).populate('items.menuItem');
    
    if (!order) {
      return ctx.answerCbQuery('الطلب غير موجود أو تم حذفه');
    }
    
    await ctx.answerCbQuery();
    
    // عرض تفاصيل الطلب بشكل كامل
    let detailsText = `📋 *تفاصيل الطلب #${order._id.toString().slice(-6)}*\n\n`;
    
    // معلومات الوقت والتاريخ
    detailsText += `📅 تاريخ الطلب: ${new Date(order.createdAt).toLocaleDateString('ar-SA')}\n`;
    detailsText += `⏰ وقت الطلب: ${new Date(order.createdAt).toLocaleTimeString('ar-SA')}\n`;
    
    // سجل حالات الطلب
    detailsText += `\n📊 *سجل حالات الطلب:*\n`;
    for (const status of order.statusHistory) {
      detailsText += `- ${new Date(status.timestamp).toLocaleString('ar-SA')}: ${getOrderStatusInArabic(status.status)}`;
      if (status.note) {
        detailsText += ` (${status.note})`;
      }
      detailsText += '\n';
    }
    
    // تفاصيل العناصر
    detailsText += `\n🍽️ *قائمة العناصر:*\n`;
    let itemsTotal = 0;
    for (const item of order.items) {
      const menuItem = item.menuItem;
      detailsText += `- ${item.quantity}x ${menuItem ? menuItem.name : 'عنصر محذوف'} (${item.price} ريال/وحدة)\n`;
      
      // إضافة الخيارات المحددة إن وجدت
      if (item.options && item.options.length > 0) {
        detailsText += `  الخيارات:\n`;
        for (const option of item.options) {
          detailsText += `    * ${option.name}: ${option.choice} (+${option.price || 0} ريال)\n`;
        }
      }
      
      // إضافة تعليمات خاصة إن وجدت
      if (item.specialInstructions) {
        detailsText += `  ملاحظات: ${item.specialInstructions}\n`;
      }
      
      // المجموع الفرعي للعنصر
      detailsText += `  المجموع: ${item.totalPrice} ريال\n`;
      itemsTotal += item.totalPrice;
    }
    
    // تفاصيل الفاتورة
    detailsText += `\n💰 *تفاصيل الفاتورة:*\n`;
    detailsText += `المجموع الفرعي: ${itemsTotal} ريال\n`;
    
    // إضافة رسوم التوصيل إذا كان طلب توصيل
    if (order.deliveryMethod === 'delivery') {
      detailsText += `رسوم التوصيل: ${order.deliveryFee || 0} ريال\n`;
    }
    
    // إضافة الخصم إذا وجد
    if (order.discount && order.discount > 0) {
      detailsText += `الخصم: ${order.discount} ريال\n`;
    }
    
    // المجموع النهائي
    detailsText += `الإجمالي: ${order.totalPrice} ريال\n`;
    
    // معلومات التوصيل والدفع
    detailsText += `\n🚚 *معلومات التوصيل:*\n`;
    detailsText += `طريقة التوصيل: ${order.deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من المطعم'}\n`;
    
    if (order.deliveryMethod === 'delivery' && order.deliveryAddress) {
      detailsText += `العنوان: ${order.deliveryAddress.address || 'غير محدد'}\n`;
      if (order.deliveryAddress.buildingNumber) {
        detailsText += `رقم المبنى: ${order.deliveryAddress.buildingNumber}\n`;
      }
      if (order.deliveryAddress.floorNumber) {
        detailsText += `الطابق: ${order.deliveryAddress.floorNumber}\n`;
      }
      if (order.deliveryAddress.apartmentNumber) {
        detailsText += `رقم الشقة: ${order.deliveryAddress.apartmentNumber}\n`;
      }
      if (order.deliveryAddress.landmark) {
        detailsText += `علامة مميزة: ${order.deliveryAddress.landmark}\n`;
      }
    }
    
    detailsText += `\n💳 *معلومات الدفع:*\n`;
    detailsText += `طريقة الدفع: ${getPaymentMethodInArabic(order.paymentMethod)}\n`;
    detailsText += `حالة الدفع: ${getPaymentStatusInArabic(order.paymentStatus)}\n`;
    
    // إرسال التفاصيل
    await ctx.reply(detailsText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 العودة', 'back_to_orders')]
      ])
    });
  } catch (error) {
    console.error('خطأ في عرض تفاصيل الطلب:', error);
    ctx.answerCbQuery('حدث خطأ أثناء عرض التفاصيل');
  }
});

// معالجة زر إعادة الطلب
bot.action(/reorder_(.+)/, async (ctx) => {
  try {
    const orderId = ctx.match[1];
    const telegramId = ctx.from.id.toString();
    
    // التحقق من وجود المستخدم
    const user = await User.findOne({ telegramId });
    if (!user) {
      return ctx.answerCbQuery('يرجى التسجيل أولاً');
    }
    
    // البحث عن الطلب
    const order = await Order.findOne({
      _id: orderId,
      user: user._id
    }).populate('items.menuItem');
    
    if (!order) {
      return ctx.answerCbQuery('الطلب غير موجود أو تم حذفه');
    }
    
    await ctx.answerCbQuery('جاري إعادة الطلب...');
    
    // إضافة عناصر الطلب السابق إلى سلة المشتريات
    // هنا يجب التكامل مع خدمة السلة (Cart Service) لإضافة العناصر
    
    // في هذه المرحلة سنفترض أن لدينا دالة لإضافة العناصر إلى السلة
    // مثال: await CartService.addItemsFromOrder(telegramId, order);
    
    // إشعار للمستخدم
    await ctx.reply(
      '✅ تمت إضافة عناصر الطلب السابق إلى سلة المشتريات.\n\nيمكنك الآن مراجعة السلة وإتمام الطلب.',
      Markup.keyboard([
        ['🍽️ قائمة الطعام', '🛒 سلة المشتريات'],
        ['📱 حسابي', '📜 طلباتي السابقة'],
        ['📞 اتصل بنا', '🏠 فروعنا']
      ]).resize()
    );
  } catch (error) {
    console.error('خطأ في إعادة الطلب:', error);
    ctx.answerCbQuery('حدث خطأ أثناء إعادة الطلب');
  }
});

// دالة مساعدة لتحويل حالة الطلب إلى العربية
function getOrderStatusInArabic(status) {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'preparing': 'قيد التحضير',
    'ready': 'جاهز',
    'out-for-delivery': 'في الطريق',
    'delivered': 'تم التسليم',
    'picked-up': 'تم الاستلام',
    'cancelled': 'ملغي'
  };
  
  return statusMap[status] || status;
}

// دالة مساعدة لتحويل طريقة الدفع إلى العربية
function getPaymentMethodInArabic(method) {
  const methodMap = {
    'cash': 'نقدي عند الاستلام',
    'card': 'بطاقة ائتمان',
    'wallet': 'محفظة إلكترونية'
  };
  
  return methodMap[method] || method;
}

// دالة مساعدة لتحويل حالة الدفع إلى العربية
function getPaymentStatusInArabic(status) {
  const statusMap = {
    'pending': 'معلق',
    'processing': 'قيد المعالجة',
    'paid': 'مدفوع',
    'failed': 'فشل الدفع',
    'refunded': 'مسترد'
  };
  
  return statusMap[status] || status;
}