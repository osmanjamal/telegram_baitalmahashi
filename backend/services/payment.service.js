const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');

class PaymentService {
  /**
   * معالجة عملية دفع
   * @param {Object} paymentData بيانات الدفع
   * @returns {Promise<Object>} نتيجة عملية الدفع
   */
  static async processPayment(paymentData) {
    try {
      const { amount, paymentMethod, userId, orderId } = paymentData;
      
      // التحقق من طريقة الدفع
      if (paymentMethod === 'cash') {
        // الدفع النقدي لا يتطلب معالجة
        return {
          success: true,
          paymentMethod: 'cash',
          amount
        };
      }
      
      // معالجة الدفع الإلكتروني باستخدام Stripe (كمثال)
      if (paymentMethod === 'card') {
        // إنشاء سجل دفع في قاعدة البيانات
        const payment = new Payment({
          order: orderId,
          user: userId,
          amount,
          paymentMethod: 'card',
          status: 'processing'
        });
        
        await payment.save();
        
        // في تطبيق حقيقي، سنقوم بإرسال طلب إلى Stripe لإجراء الدفع
        // هنا نقوم بمحاكاة نجاح العملية
        
        // تحديث سجل الدفع
        payment.status = 'succeeded';
        payment.transactionId = `txn_${Date.now()}`;
        payment.paymentDate = Date.now();
        
        await payment.save();
        
        return {
          success: true,
          paymentMethod: 'card',
          transactionId: payment.transactionId,
          amount
        };
      }
      
      // معالجة الدفع عبر المحفظة الإلكترونية
      // معالجة الدفع عبر المحفظة الإلكترونية
      if (paymentMethod === 'wallet') {
        // إنشاء سجل دفع في قاعدة البيانات
        const payment = new Payment({
          order: orderId,
          user: userId,
          amount,
          paymentMethod: 'wallet',
          status: 'processing'
        });
        
        await payment.save();
        
        // في تطبيق حقيقي، سنتحقق من رصيد المحفظة ونخصم المبلغ
        // هنا نقوم بمحاكاة نجاح العملية
        
        // تحديث سجل الدفع
        payment.status = 'succeeded';
        payment.transactionId = `wallet_${Date.now()}`;
        payment.paymentDate = Date.now();
        
        await payment.save();
        
        return {
          success: true,
          paymentMethod: 'wallet',
          transactionId: payment.transactionId,
          amount
        };
      }
      
      // طريقة دفع غير مدعومة
      return {
        success: false,
        error: 'طريقة دفع غير مدعومة'
      };
    } catch (error) {
      console.error('خطأ في معالجة الدفع:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * إنشاء جلسة دفع
   * @param {Object} sessionData بيانات جلسة الدفع
   * @returns {Promise<Object>} جلسة الدفع
   */
  static async createPaymentSession(sessionData) {
    try {
      const { orderId, amount, paymentMethod, userId, userEmail, userName } = sessionData;
      
      // في تطبيق حقيقي، سنقوم بإنشاء جلسة دفع مع Stripe
      // هنا نقوم بمحاكاة استجابة جلسة الدفع
      
      const sessionId = `sess_${Date.now()}`;
      const url = `${process.env.APP_URL || 'http://localhost:3000'}/checkout/payment?session=${sessionId}`;
      
      // إنشاء سجل دفع في قاعدة البيانات
      const payment = new Payment({
        order: orderId,
        user: userId,
        amount,
        paymentMethod,
        status: 'pending',
        sessionId
      });
      
      await payment.save();
      
      return {
        id: sessionId,
        url,
        amount,
        currency: 'SAR',
        status: 'pending'
      };
    } catch (error) {
      console.error('خطأ في إنشاء جلسة الدفع:', error);
      throw error;
    }
  }
  
  /**
   * استرداد مدفوعات طلب
   * @param {Object} refundData بيانات الاسترداد
   * @returns {Promise<Object>} نتيجة عملية الاسترداد
   */
  static async refundPayment(refundData) {
    try {
      const { orderId, amount, reason } = refundData;
      
      // البحث عن الطلب
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('الطلب غير موجود');
      }
      
      // البحث عن معاملة الدفع
      const payment = await Payment.findOne({
        order: orderId,
        status: 'succeeded'
      });
      
      if (!payment) {
        throw new Error('معاملة الدفع غير موجودة أو غير ناجحة');
      }
      
      // في تطبيق حقيقي، سنقوم بإرسال طلب استرداد إلى Stripe
      // هنا نقوم بمحاكاة نجاح عملية الاسترداد
      
      // تحديث سجل الدفع
      payment.status = 'refunded';
      payment.refundId = `refund_${Date.now()}`;
      payment.refundReason = reason;
      payment.refundedAt = Date.now();
      payment.refundedAmount = amount || payment.amount;
      
      await payment.save();
      
      return {
        success: true,
        id: payment.refundId,
        amount: payment.refundedAmount,
        status: 'succeeded'
      };
    } catch (error) {
      console.error('خطأ في استرداد المدفوعات:', error);
      throw error;
    }
  }
  
  /**
   * التحقق من حالة جلسة دفع
   * @param {String} sessionId معرف جلسة الدفع
   * @returns {Promise<Object>} حالة جلسة الدفع
   */
  static async checkPaymentSession(sessionId) {
    try {
      // البحث عن معاملة الدفع
      const payment = await Payment.findOne({ sessionId });
      
      if (!payment) {
        throw new Error('جلسة الدفع غير موجودة');
      }
      
      return {
        status: payment.status,
        sessionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        transactionId: payment.transactionId
      };
    } catch (error) {
      console.error('خطأ في التحقق من حالة جلسة الدفع:', error);
      throw error;
    }
  }
  
  /**
   * الحصول على إيصال دفع
   * @param {String} transactionId معرف معاملة الدفع
   * @returns {Promise<String>} رابط الإيصال
   */
  static async getReceiptUrl(transactionId) {
    try {
      // البحث عن معاملة الدفع
      const payment = await Payment.findOne({ transactionId });
      
      if (!payment) {
        throw new Error('معاملة الدفع غير موجودة');
      }
      
      // في تطبيق حقيقي، سنقوم بإنشاء أو جلب رابط الإيصال من Stripe
      // هنا نقوم بإرجاع رابط وهمي
      
      const receiptUrl = `${process.env.APP_URL || 'http://localhost:3000'}/receipts/${transactionId}`;
      
      // تحديث رابط الإيصال في سجل الدفع
      payment.receiptUrl = receiptUrl;
      await payment.save();
      
      return receiptUrl;
    } catch (error) {
      console.error('خطأ في الحصول على إيصال الدفع:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;