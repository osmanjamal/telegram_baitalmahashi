const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// تحميل متغيرات البيئة
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

// استيراد ملف اتصال قاعدة البيانات
const connectDB = require('../database/db.config');

// استيراد المسارات
const apiRoutes = require('./routes/api.routes');
const authRoutes = require('./routes/auth.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const kitchenRoutes = require('./routes/kitchen.routes');
const deliveryRoutes = require('./routes/delivery.routes');

// استيراد وسطاء الخطأ والتسجيل
const errorMiddleware = require('./middleware/error.middleware');
const loggerMiddleware = require('./middleware/logger.middleware');

// إنشاء تطبيق Express
const app = express();

// اتصال بقاعدة البيانات
connectDB();

// الوسطاء العامة
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// وسيط تسجيل الطلبات في بيئة التطوير
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// استخدام وسيط التسجيل المخصص
app.use(loggerMiddleware);

// خدمة الملفات الثابتة للواجهة الأمامية
app.use(express.static(path.join(__dirname, '../frontend')));

// تسجيل بوت تلغرام
require('./telegram-bot');

// تعريف المسارات
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/delivery', deliveryRoutes);

// التعامل مع مسارات الواجهة الأمامية (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend', 'index.html'));
});

// وسيط معالجة الأخطاء
app.use(errorMiddleware);

// بدء تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT} في بيئة ${process.env.NODE_ENV}`);
  console.log(`📊 واجهة المستخدم: http://localhost:${PORT}`);
  console.log(`🍽️ واجهة المطبخ: http://localhost:${PORT}/kitchen`);
  console.log(`👨‍💼 لوحة الإدارة: http://localhost:${PORT}/admin`);
});

// معالجة الاستثناءات غير المعالجة
process.on('uncaughtException', (err) => {
  console.error('خطأ غير معالج:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('وعد مرفوض غير معالج:', err);
  process.exit(1);
});

module.exports = app;