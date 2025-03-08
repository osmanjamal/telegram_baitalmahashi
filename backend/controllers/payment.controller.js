const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');
const User = require('../models/User.model');
const PaymentService = require('../services/payment.service');

// إنشاء جلسة دفع جديدة
exports.createPaymentSession = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    // التحقق من وجود الطلب
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // التحقق من ملكية الطلب
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بدفع هذا الطلب'
      });
    }
    
    // التحقق من أن الطلب لم يتم دفعه بالفعل
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'تم دفع هذا الطلب بالفعل'
      });
    }
    
    // الحصول على بيانات المستخدم
    const user = await User.findById(req.user.id);
    
    // إنشاء جلسة دفع جديدة
    const paymentSession = await PaymentService.createPaymentSession({
      orderId: order._id,
      amount: order.totalPrice,
      paymentMethod,
      userId: user._id,
      userEmail: user.email,
      userName: user.name
    });
    
    // حفظ بيانات الجلسة
    const payment = new Payment({
      order: order._id,
      user: user._id,
      amount: order.totalPrice,
      paymentMethod,
      sessionId: paymentSession.id,
      status: 'pending'
    });
    
    await payment.save();
    
    // تحديث حالة الدفع للطلب
    order.paymentStatus = 'processing';
    order.paymentDetails = {
      sessionId: paymentSession.id,
      paymentMethod
    };
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: paymentSession.id,
        redirectUrl: paymentSession.url
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء جلسة الدفع:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء جلسة الدفع'
    });
  }
};

// تحديث حالة الدفع (Webhook)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { sessionId, status, transactionId } = req.body;
    
    // البحث عن معاملة الدفع المرتبطة بالجلسة
    const payment = await Payment.findOne({ sessionId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'معاملة الدفع غير موجودة'
      });
    }
    
    // تحديث حالة الدفع
    payment.status = status;
    payment.transactionId = transactionId;
    payment.updatedAt = Date.now();
    
    await payment.save();
    
    // تحديث حالة الدفع للطلب
    const order = await Order.findById(payment.order);
    
    if (order) {
      // تحديث حالة الدفع بناءً على نتيجة العملية
      if (status === 'succeeded' || status === 'paid') {
        order.paymentStatus = 'paid';
        order.paymentDetails = {
          ...order.paymentDetails,
          transactionId,
          paymentDate: Date.now()
        };
      } else if (status === 'failed') {
        order.paymentStatus = 'failed';
      } else if (status === 'refunded') {
        order.paymentStatus = 'refunded';
      }
      
      await order.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة الدفع بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة الدفع:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الدفع'
    });
  }
};

// استرداد مدفوعات طلب
exports.refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    // التحقق من صلاحيات المسؤول
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح بإجراء عمليات استرداد'
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
    
    // التحقق من أن الطلب قد تم دفعه
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن استرداد مدفوعات لطلب لم يتم دفعه'
      });
    }
    
    // البحث عن معاملة الدفع
    const payment = await Payment.findOne({ order: orderId, status: 'succeeded' });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'معاملة الدفع غير موجودة'
      });
    }
    
    // طلب استرداد المدفوعات
    const refund = await PaymentService.refundPayment({
      paymentId: payment.transactionId,
      amount: payment.amount,
      reason: reason || 'طلب استرداد من المسؤول'
    });
    
    // تحديث حالة الدفع
    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundReason = reason;
    payment.refundedAt = Date.now();
    
    await payment.save();
    
    // تحديث حالة الدفع للطلب
    order.paymentStatus = 'refunded';
    order.paymentDetails = {
      ...order.paymentDetails,
      refundId: refund.id,
      refundReason: reason,
      refundedAt: Date.now()
    };
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'تم استرداد المدفوعات بنجاح',
      data: {
        refundId: refund.id,
        amount: payment.amount
      }
    });
  } catch (error) {
    console.error('خطأ في استرداد المدفوعات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في استرداد المدفوعات'
    });
  }
};

// الحصول على تاريخ معاملات الدفع للمستخدم
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('order', 'totalPrice status createdAt')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('خطأ في جلب معاملات الدفع:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معاملات الدفع'
    });
  }
};