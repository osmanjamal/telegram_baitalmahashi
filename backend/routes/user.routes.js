const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { profileValidationRules, addressValidationRules, validate } = require('../middleware/validation.middleware');
const { protect, admin } = require('../middleware/auth.middleware');

// جميع المسارات تتطلب مصادقة
router.use(protect);

// مسارات المستخدم
router.get('/profile', userController.getUserProfile);
router.put('/profile', profileValidationRules, validate, userController.updateUserProfile);
router.post('/address', addressValidationRules, validate, userController.addAddress);
router.delete('/address/:addressId', userController.deleteAddress);
router.get('/loyalty', userController.getLoyaltyInfo);
router.get('/stats', userController.getUserStats);

// مسارات الإدارة (تتطلب صلاحيات مسؤول)
router.get('/admin/all', admin, userController.getAllUsers);

module.exports = router;