const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authValidationRules, validate } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');

// مسارات المصادقة
router.post('/telegram', authValidationRules.telegramAuth, validate, authController.telegramAuth);
router.post('/admin', authValidationRules.adminLogin, validate, authController.adminLogin);
router.post('/kitchen', authValidationRules.kitchenLogin, validate, authController.kitchenLogin);
router.get('/me', protect, authController.getMe);

module.exports = router;