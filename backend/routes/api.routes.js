const express = require('express');
const router = express.Router();

// استيراد المسارات الأخرى
const authRoutes = require('./auth.routes');
const menuRoutes = require('./menu.routes');
const orderRoutes = require('./order.routes');
const userRoutes = require('./user.routes');
const kitchenRoutes = require('./kitchen.routes');
const deliveryRoutes = require('./delivery.routes');

// تعريف مسارات الـ API
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/delivery', deliveryRoutes);

// مسار حالة الـ API
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;