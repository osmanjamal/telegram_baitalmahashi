const logger = require('../utils/logger.utils');

/**
 * وسيط معالجة الأخطاء المركزي
 * يقوم بالتقاط جميع الأخطاء ومعالجتها بشكل موحد
 */
const errorMiddleware = (err, req, res, next) => {
  // سجل الخطأ في وحدة التحكم والملفات
  console.error('خطأ في الخادم:', err);
  logger.error('خطأ في الخادم:', { 
    error: err.message, 
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user ? req.user.id : 'غير مسجل دخول' 
  });
  
  // نوع الخطأ وكود الحالة
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'خطأ في الخادم';
  
  // معالجة خطأ Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'معرف غير صالح';
    statusCode = 400;
  }
  
  // معالجة خطأ Mongoose التكرار
  if (err.code === 11000) {
    message = `قيمة مكررة: ${Object.keys(err.keyValue).join(', ')}`;
    statusCode = 400;
  }
  
  // معالجة خطأ Mongoose التحقق
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }
  
  // معالجة خطأ JSON Web Token
  if (err.name === 'JsonWebTokenError') {
    message = 'توكن غير صالح';
    statusCode = 401;
  }
  
  // معالجة خطأ انتهاء صلاحية JWT
  if (err.name === 'TokenExpiredError') {
    message = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
    statusCode = 401;
  }

  // معالجة خطأ عدم وجود صلاحية
  if (err.name === 'ForbiddenError' || err.statusCode === 403) {
    message = 'ليس لديك صلاحية للوصول إلى هذا المورد';
    statusCode = 403;
  }

  // معالجة خطأ عدم وجود المورد
  if (err.name === 'NotFoundError' || err.statusCode === 404) {
    message = 'المورد المطلوب غير موجود';
    statusCode = 404;
  }

  // معالجة خطأ طلب خاطئ
  if (err.name === 'BadRequestError' || err.statusCode === 400) {
    statusCode = 400;
  }

  // معالجة أخطاء شركات الدفع الخارجية
  if (err.name === 'PaymentError') {
    message = err.message || 'حدث خطأ أثناء معالجة الدفع';
    statusCode = 400;
  }

  // معالجة أخطاء خدمات التوصيل
  if (err.name === 'DeliveryError') {
    message = err.message || 'حدث خطأ في خدمة التوصيل';
    statusCode = 500;
  }

  // معالجة أخطاء تلغرام
  if (err.name === 'TelegramError') {
    message = err.message || 'حدث خطأ في خدمة تلغرام';
    statusCode = 500;
  }

  // معالجة أخطاء المخزن المؤقت
  if (err.name === 'CacheError') {
    message = err.message || 'حدث خطأ في المخزن المؤقت';
    statusCode = 500;
  }
  
  // إرسال الاستجابة
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    errorCode: err.code || err.name
  });
};

module.exports = errorMiddleware;