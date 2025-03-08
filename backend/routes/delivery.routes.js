const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { protect, deliveryAgent, admin } = require('../middleware/auth.middleware');

// مسارات التوصيل (تتطلب مصادقة)
router.use(protect);

// مسارات المندوب
router.get('/orders', deliveryAgent, deliveryController.getOrdersForDelivery);
router.get('/agent/:agentId?', deliveryAgent, deliveryController.getAgentOrders);
router.put('/order/:orderId/status', deliveryAgent, deliveryController.updateOrderStatus);
router.post('/location', deliveryAgent, deliveryController.updateAgentLocation);

// مسارات المدير
router.post('/assign', admin, deliveryController.assignOrderToAgent);

module.exports = router;