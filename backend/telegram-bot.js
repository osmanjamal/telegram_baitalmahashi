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
        orderText += `- ${item.quantity}x ${menuItem ? menuItem.name : 'عنصر محذوف'}