const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { menuValidationRules, validate } = require('../middleware/validation.middleware');
const { protect, admin } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// إعداد تخزين الصور
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../../assets/images/menu'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'menu-' + uniqueSuffix + ext);
  }
});

// فلترة أنواع الملفات
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. فقط JPEG، JPG، PNG و WEBP مدعومة.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 ميجابايت
  fileFilter
});

// مسارات عامة (لا تتطلب مصادقة)
router.get('/categories', menuController.getAllCategories);
router.get('/category/:categoryId', menuController.getMenuItemsByCategory);
router.get('/items', menuController.getAllMenuItems);
router.get('/featured', menuController.getFeaturedItems);

// مسارات الإدارة (تتطلب مصادقة ومسؤول)
router.use('/admin', protect, admin);

router.post(
  '/admin/category',
  menuValidationRules.category,
  validate,
  menuController.createCategory
);

router.post(
  '/admin/item',
  upload.single('image'),
  menuValidationRules.menuItem,
  validate,
  menuController.createMenuItem
);

router.put(
  '/admin/item/:menuItemId',
  upload.single('image'),
  menuController.updateMenuItem
);

router.delete(
  '/admin/item/:menuItemId',
  menuController.deleteMenuItem
);

module.exports = router;