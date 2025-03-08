const Order = require('../models/Order.model');
const User = require('../models/User.model');
const NotificationService = require('../services/notification.service');

// الحصول على الطلبات النشطة للمطبخ
exports.getActiveOrders = async (req, res) => {
  try {
    // جلب الطلبات بحالة: في الانتظار، مؤكدة، قيد التحضير
    const activeOrders = await Order.find({
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    })
    .populate('user', 'name phone telegramId')
    .populate('items.menuItem', 'name price image category')
    .sort('createdAt');
    
    res.status(200).json({
      success: true,
      count: activeOrders.length,
      data: activeOrders
    });
  } catch (error) {
    console.error('خطأ في جلب الطلبات النشطة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلبات النشطة'
    });
  }
};

// الحصول على الطلبات الجاهزة للتسليم/التوصيل
exports.getReadyOrders = async (req, res) => {
  try {
    // جلب الطلبات بحالة: جاهزة
    const readyOrders = await Order.find({
      status: 'ready'
    })
    .populate('user', 'name phone telegramId')
    .populate('items.menuItem', 'name price image')
    .sort('createdAt');
    
    res.status(200).json({
      success: true,
      count: readyOrders.length,
      data: readyOrders
    });
  } catch (error) {
    console.error('خطأ في جلب الطلبات الجاهزة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلبات الجاهزة'
    });
  }
};

// تحديث حالة الطلب
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    
    // التحقق من صحة الحالة
    const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الطلب غير صالحة'
      });
    }
    
    // البحث عن الطلب
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // الحالات المسموح بالانتقال إليها
    const allowedTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['out-for-delivery', 'delivered', 'cancelled']
    };
    
    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن تغيير الحالة من "${order.status}" إلى "${status}"`
      });
    }
    
    // تحديث حالة الطلب
    order.status = status;
    
    // إضافة إلى سجل الحالات
    order.statusHistory.push({
      status,
      timestamp: Date.now(),
      note: note || ''
    });
    
    // حفظ التغييرات
    await order.save();
    
    // إرسال إشعار للعميل
    const user = await User.findById(order.user);
    if (user && user.telegramId) {
      await NotificationService.sendOrderStatusUpdate(order, user.telegramId);
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة الطلب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الطلب'
    });
  }
};

// تعديل الوقت المتوقع للتحضير
exports.updateEstimatedTime = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { estimatedMinutes } = req.body;
    
    if (!estimatedMinutes || isNaN(estimatedMinutes)) {
      return res.status(400).json({
        success: false,
        message: 'الوقت المتوقع غير صالح'
      });
    }
    
    // البحث عن الطلب
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // حساب وقت التجهيز المتوقع
    const estimatedPreparationTime = new Date();
    estimatedPreparationTime.setMinutes(
      estimatedPreparationTime.getMinutes() + parseInt(estimatedMinutes)
    );
    
    // تحديث الطلب
    order.estimatedPreparationTime = estimatedPreparationTime;
    await order.save();
    
    // إرسال إشعار للعميل
    const user = await User.findById(order.user);
    if (user && user.telegramId) {
      await NotificationService.sendEstimatedTimeUpdate(
        order,
        user.telegramId,
        estimatedMinutes
      );
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('خطأ في تحديث الوقت المتوقع:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الوقت المتوقع للتحضير'
    });
  }
};

// إحصائيات المطبخ
exports.getKitchenStats = async (req, res) => {
  try {
    // إحصائيات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    // متوسط وقت التحضير
    const completedOrders = await Order.find({
      status: { $in: ['ready', 'delivered'] },
      createdAt: { $gte: today }
    });
    
    let avgPrepTime = 0;
    
    if (completedOrders.length > 0) {
      const totalPrepTime = completedOrders.reduce((total, order) => {
        // البحث عن تاريخ التحضير الجاهز من السجل
        const readyStatus = order.statusHistory.find(h => h.status === 'ready');
        if (readyStatus && readyStatus.timestamp) {
          return total + (new Date(readyStatus.timestamp) - new Date(order.createdAt));
        }
        return total;
      }, 0);
      
      avgPrepTime = Math.round(totalPrepTime / completedOrders.length / 60000); // بالدقائق
    }
    
    // تحويل البيانات إلى تنسيق أنسب
    const formattedStats = {
      todayOrders: {
        pending: todayStats.find(s => s._id === 'pending')?.count || 0,
        confirmed: todayStats.find(s => s._id === 'confirmed')?.count || 0,
        preparing: todayStats.find(s => s._id === 'preparing')?.count || 0,
        ready: todayStats.find(s => s._id === 'ready')?.count || 0,
        delivered: todayStats.find(s => s._id === 'delivered')?.count || 0,
        cancelled: todayStats.find(s => s._id === 'cancelled')?.count || 0,
        total: todayStats.reduce((total, stat) => total + stat.count, 0)
      },
      todayRevenue: todayStats.reduce((total, stat) => {
        // نحسب فقط الإيرادات من الطلبات المكتملة
        if (['ready', 'delivered'].includes(stat._id)) {
          return total + stat.totalAmount;
        }
        return total;
      }, 0),
      avgPrepTime
    };
    
    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات المطبخ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات المطبخ'
    });
  }
};