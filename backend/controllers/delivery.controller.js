const Order = require('../models/Order.model');
const DeliveryAgent = require('../models/DeliveryAgent.model');
const User = require('../models/User.model');
const NotificationService = require('../services/notification.service');

// الحصول على جميع الطلبات الجاهزة للتوصيل
exports.getOrdersForDelivery = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['ready', 'out-for-delivery'] },
      deliveryMethod: 'delivery'
    })
    .populate('user', 'name phone telegramId')
    .populate('items.menuItem', 'name price')
    .sort('createdAt');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('خطأ في جلب طلبات التوصيل:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب طلبات التوصيل'
    });
  }
};

// الحصول على طلبات مندوب محدد
exports.getAgentOrders = async (req, res) => {
  try {
    const agentId = req.params.agentId || req.user.id;
    
    // التحقق من وجود المندوب
    const agent = await DeliveryAgent.findById(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'المندوب غير موجود'
      });
    }
    
    // جلب الطلبات الخاصة بالمندوب
    const orders = await Order.find({
      deliveryAgent: agentId,
      status: { $in: ['out-for-delivery', 'delivered'] }
    })
    .populate('user', 'name phone telegramId')
    .populate('items.menuItem', 'name price')
    .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('خطأ في جلب طلبات المندوب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب طلبات المندوب'
    });
  }
};

// تعيين مندوب لطلب
exports.assignOrderToAgent = async (req, res) => {
  try {
    const { orderId, agentId } = req.body;
    
    // التحقق من وجود المندوب
    const agent = await DeliveryAgent.findById(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'المندوب غير موجود'
      });
    }
    
    // التحقق من وجود الطلب
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // التحقق من أن الطلب جاهز للتوصيل
    if (order.status !== 'ready' || order.deliveryMethod !== 'delivery') {
      return res.status(400).json({
        success: false,
        message: 'الطلب غير مؤهل للتوصيل'
      });
    }
    
    // تعيين المندوب وتحديث حالة الطلب
    order.deliveryAgent = agentId;
    order.status = 'out-for-delivery';
    order.statusHistory.push({
      status: 'out-for-delivery',
      timestamp: Date.now(),
      note: `تم تعيين المندوب ${agent.name}`
    });
    
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
    console.error('خطأ في تعيين المندوب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تعيين المندوب للطلب'
    });
  }
};

// تحديث حالة الطلب من قبل المندوب
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    
    // التحقق من صحة الحالة
    const validStatuses = ['out-for-delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الطلب غير صالحة'
      });
    }
    
    // التحقق من وجود الطلب
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // التحقق من أن المندوب مخصص لهذا الطلب
    if (order.deliveryAgent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتحديث هذا الطلب'
      });
    }
    
    // تحديث حالة الطلب
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: Date.now(),
      note: note || ''
    });
    
    // إذا تم التسليم، تحديث وقت التسليم
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }
    
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

// تحديث موقع المندوب
exports.updateAgentLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'إحداثيات الموقع مطلوبة'
      });
    }
    
    // تحديث موقع المندوب
    await DeliveryAgent.findByIdAndUpdate(req.user.id, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      lastLocationUpdate: Date.now()
    });
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث الموقع بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحديث موقع المندوب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث موقع المندوب'
    });
  }
};