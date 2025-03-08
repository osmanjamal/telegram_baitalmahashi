const Order = require('../models/Order.model');
const User = require('../models/User.model');
const MenuItem = require('../models/MenuItem.model');
const NotificationService = require('../services/notification.service');
const PaymentService = require('../services/payment.service');
const LoyaltyService = require('../services/loyalty.service');

// إنشاء طلب جديد
exports.createOrder = async (req, res) => {
  try {
    const {
      items, deliveryMethod, deliveryAddress,
      deliveryTime, paymentMethod, specialInstructions
    } = req.body;
    
    // التحقق من وجود العناصر
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'عناصر الطلب مطلوبة'
      });
    }
    
    // التحقق من طريقة التوصيل
    if (!deliveryMethod || !['delivery', 'pickup'].includes(deliveryMethod)) {
      return res.status(400).json({
        success: false,
        message: 'طريقة توصيل غير صالحة'
      });
    }
    
    // التحقق من العنوان إذا كان التوصيل للمنزل
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'عنوان التوصيل مطلوب'
      });
    }
    
    // التحقق من طريقة الدفع
    if (!paymentMethod || !['cash', 'card', 'wallet'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'طريقة دفع غير صالحة'
      });
    }
    
    // جلب بيانات المستخدم
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // حساب تفاصيل الطلب
    let totalPrice = 0;
    const orderItems = [];
    
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `عنصر القائمة غير موجود: ${item.menuItemId}`
        });
      }
      
      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `العنصر غير متاح حالياً: ${menuItem.name}`
        });
      }
      
      // حساب سعر العنصر مع الخيارات
      let itemPrice = menuItem.price;
      const selectedOptions = [];
      
      if (item.options && item.options.length > 0) {
        for (const option of item.options) {
          const menuItemOption = menuItem.options.find(o => o.name === option.name);
          
          if (menuItemOption) {
            const choice = menuItemOption.choices.find(c => c.name === option.choice);
            
            if (choice) {
              itemPrice += choice.price;
              selectedOptions.push({
                name: option.name,
                choice: option.choice,
                price: choice.price
              });
            }
          }
        }
      }
      
      // حساب السعر الإجمالي للعنصر
      const itemTotalPrice = itemPrice * item.quantity;
      totalPrice += itemTotalPrice;
      
      // إضافة العنصر للطلب
      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: itemPrice,
        totalPrice: itemTotalPrice,
        options: selectedOptions,
        specialInstructions: item.specialInstructions || ''
      });
    }
    
    // إضافة رسوم التوصيل إذا كان التوصيل للمنزل
    const deliveryFee = deliveryMethod === 'delivery' ? 10 : 0; // مثال: 10 ريال رسوم توصيل
    totalPrice += deliveryFee;
    
    // خلق كائن الطلب الجديد
    const order = new Order({
      user: user._id,
      items: orderItems,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      deliveryFee,
      deliveryTime: deliveryTime ? new Date(deliveryTime) : null,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'processing',
      totalPrice,
      specialInstructions: specialInstructions || '',
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: Date.now(),
          note: 'تم إنشاء الطلب'
        }
      ]
    });
    
    // معالجة الدفع إذا كان إلكترونياً
    if (paymentMethod !== 'cash') {
      const paymentResult = await PaymentService.processPayment({
        amount: totalPrice,
        paymentMethod,
        userId: user._id,
        orderId: order._id
      });
      
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'فشل في معالجة الدفع',
          error: paymentResult.error
        });
      }
      
      // تحديث معلومات الدفع
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        transactionId: paymentResult.transactionId,
        paymentDate: new Date(),
        paymentMethod
      };
    }
    
    // حفظ الطلب
    await order.save();
    
    // إضافة الطلب لقائمة طلبات المستخدم
    user.orders.push(order._id);
    await user.save();
    
    // إضافة نقاط الولاء
    await LoyaltyService.addPointsForOrder(user._id, totalPrice);
    
    // إرسال إشعار للمطبخ
    await NotificationService.notifyKitchenNewOrder(order);
    
    // إرسال تأكيد للعميل
    if (user.telegramId) {
      await NotificationService.sendOrderConfirmation(order, user.telegramId);
    }
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('خطأ في إنشاء الطلب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الطلب'
    });
  }
};

// الحصول على طلب بواسطة المعرف
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'name phone telegramId')
      .populate('items.menuItem', 'name price image');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // التحقق من ملكية الطلب (إلا إذا كان المستخدم مسؤول)
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin && !req.user.isKitchenStaff) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول إلى هذا الطلب'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('خطأ في جلب الطلب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلب'
    });
  }
};

// الحصول على طلبات المستخدم
exports.getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    const orders = await Order.find({ user: req.user.id })
      .populate('items.menuItem', 'name price image')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const totalOrders = await Order.countDocuments({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      data: orders
    });
  } catch (error) {
    console.error('خطأ في جلب طلبات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب طلبات المستخدم'
    });
  }
};

// إلغاء طلب
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // التحقق من ملكية الطلب (إلا إذا كان المستخدم مسؤول)
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بإلغاء هذا الطلب'
      });
    }
    
    // التحقق من أن الطلب قابل للإلغاء
    const cancelableStatuses = ['pending', 'confirmed'];
    if (!cancelableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء هذا الطلب في حالته الحالية'
      });
    }
    
    // تحديث حالة الطلب
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: Date.now(),
      note: cancellationReason || 'تم إلغاء الطلب من قبل العميل'
    });
    
    // استرداد المدفوعات إذا كان الدفع إلكترونياً
    if (order.paymentMethod !== 'cash' && order.paymentStatus === 'paid') {
      await PaymentService.refundPayment({
        orderId: order._id,
        amount: order.totalPrice,
        reason: 'إلغاء الطلب'
      });
      
      order.paymentStatus = 'refunded';
    }
    
    await order.save();
    
    // إرسال إشعار للمطبخ والعميل
    await NotificationService.notifyKitchenOrderCancelled(order);
    
    const user = await User.findById(order.user);
    if (user && user.telegramId) {
      await NotificationService.sendOrderCancellation(order, user.telegramId);
    }
    
    res.status(200).json({
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      data: order
    });
  } catch (error) {
    console.error('خطأ في إلغاء الطلب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إلغاء الطلب'
    });
  }
};

// الحصول على جميع الطلبات (للمسؤولين)
exports.getAllOrders = async (req, res) => {
  try {
    // التحقق من صلاحيات المسؤول
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    
    // فلترة حسب الحالة إذا تم تحديدها
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // فلترة حسب التاريخ
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const orders = await Order.find(filter)
      .populate('user', 'name phone telegramId')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const totalOrders = await Order.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      data: orders
    });
  } catch (error) {
    console.error('خطأ في جلب جميع الطلبات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب جميع الطلبات'
    });
  }
};