const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { orderValidationRules, validate } = require('../middleware/validation.middleware');
const { protect, admin } = require('../middleware/auth.middleware');

// جميع المسارات تتطلب مصادقة
router.use(protect);

// مسارات الطلبات
router.post('/', orderValidationRules.createOrder, validate, orderController.createOrder);
router.get('/me', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderById);
router.post('/:orderId/cancel', orderController.cancelOrder);

// مسارات الإدارة (تتطلب صلاحيات مسؤول)
router.get('/admin/all', admin, orderController.getAllOrders);

module.exports = router;