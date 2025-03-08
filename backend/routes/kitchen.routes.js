const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchen.controller');
const { protect, kitchenStaff } = require('../middleware/auth.middleware');

// جميع المسارات تتطلب مصادقة وصلاحيات المطبخ
router.use(protect, kitchenStaff);

// مسارات المطبخ
router.get('/orders/active', kitchenController.getActiveOrders);
router.get('/orders/ready', kitchenController.getReadyOrders);
router.put('/order/:orderId/status', kitchenController.updateOrderStatus);
router.put('/order/:orderId/estimated-time', kitchenController.updateEstimatedTime);
router.get('/stats', kitchenController.getKitchenStats);

module.exports = router;