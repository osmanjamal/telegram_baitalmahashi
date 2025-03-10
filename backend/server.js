const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');

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
app.use(cors({
  origin: ['https://t.me', 'https://web.telegram.org', process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true
}));
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

// إضافة رأس Telegram WebApp لدعم تكامل تلغرام
app.use((req, res, next) => {
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// ضبط المسارات الخاصة بـ Telegram WebApp
app.get('/tgwebapp', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend', 'index.html'));
});

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

// التحقق إذا كان يجب تشغيل خادم HTTPS (لبيئة الإنتاج)
if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY && process.env.SSL_CERT) {
  // قراءة شهادات SSL
  const privateKey = fs.readFileSync(process.env.SSL_KEY, 'utf8');
  const certificate = fs.readFileSync(process.env.SSL_CERT, 'utf8');
  
  const credentials = { key: privateKey, cert: certificate };
  
  // إنشاء خادم HTTPS
  const httpsServer = https.createServer(credentials, app);
  
  httpsServer.listen(PORT, () => {
    console.log(`🔒 الخادم يعمل بـ HTTPS على المنفذ ${PORT} في بيئة ${process.env.NODE_ENV}`);
    console.log(`📊 واجهة المستخدم: https://${process.env.DOMAIN || 'localhost'}:${PORT}`);
    console.log(`🍽️ واجهة المطبخ: https://${process.env.DOMAIN || 'localhost'}:${PORT}/kitchen`);
    console.log(`👨‍💼 لوحة الإدارة: https://${process.env.DOMAIN || 'localhost'}:${PORT}/admin`);
    console.log(`🤖 رابط تطبيق تلغرام: https://${process.env.DOMAIN || 'localhost'}:${PORT}/tgwebapp`);
  });
} else {
  // إنشاء خادم HTTP (للتطوير المحلي)
  app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT} في بيئة ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 واجهة المستخدم: http://localhost:${PORT}`);
    console.log(`🍽️ واجهة المطبخ: http://localhost:${PORT}/kitchen`);
    console.log(`👨‍💼 لوحة الإدارة: http://localhost:${PORT}/admin`);
    console.log(`🤖 رابط تطبيق تلغرام: http://localhost:${PORT}/tgwebapp`);
  });
}

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