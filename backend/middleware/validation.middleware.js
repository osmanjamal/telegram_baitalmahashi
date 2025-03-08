const { check, validationResult } = require('express-validator');

// وسيط التحقق من صحة النتائج
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'خطأ في البيانات المدخلة',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// قواعد التحقق للتسجيل وتسجيل الدخول
const authValidationRules = {
  // قواعد التحقق لتسجيل الدخول بواسطة المدير
  adminLogin: [
    check('username', 'اسم المستخدم مطلوب').notEmpty(),
    check('password', 'كلمة المرور مطلوبة').notEmpty()
  ],
  
  // قواعد التحقق لتسجيل الدخول بواسطة المطبخ
  kitchenLogin: [
    check('username', 'اسم المستخدم مطلوب').notEmpty(),
    check('password', 'كلمة المرور مطلوبة').notEmpty()
  ],
  
  // قواعد التحقق للمصادقة عبر تلغرام
  telegramAuth: [
    check('id', 'معرف تلغرام مطلوب').notEmpty().isString(),
    check('auth_date', 'تاريخ المصادقة مطلوب').notEmpty().isNumeric(),
    check('hash', 'التوقيع مطلوب').notEmpty().isString()
  ]
};

// قواعد التحقق للطلبات
const orderValidationRules = {
  // قواعد التحقق لإنشاء طلب
  createOrder: [
    check('items', 'يجب أن تكون العناصر مصفوفة غير فارغة')
      .isArray({ min: 1 }),
    check('items.*.menuItemId', 'معرف عنصر القائمة مطلوب')
      .notEmpty().isMongoId(),
    check('items.*.quantity', 'الكمية يجب أن تكون رقمًا موجبًا')
      .isInt({ min: 1 }),
    check('deliveryMethod', 'طريقة التوصيل غير صالحة')
      .isIn(['delivery', 'pickup']),
    check('paymentMethod', 'طريقة الدفع غير صالحة')
      .isIn(['cash', 'card', 'wallet'])
  ]
};

// قواعد التحقق لعناصر القائمة
const menuValidationRules = {
  // قواعد التحقق لإنشاء/تحديث عنصر القائمة
  menuItem: [
    check('name', 'اسم العنصر مطلوب').notEmpty(),
    check('price', 'السعر يجب أن يكون رقمًا موجبًا')
      .isFloat({ min: 0 }),
    check('category', 'الفئة مطلوبة').notEmpty().isMongoId()
  ],
  
  // قواعد التحقق لإنشاء/تحديث فئة
  category: [
    check('name', 'اسم الفئة مطلوب').notEmpty(),
    check('order', 'الترتيب يجب أن يكون رقمًا صحيحًا')
      .optional().isInt()
  ]
};

// قواعد التحقق لتحديث الملف الشخصي
const profileValidationRules = [
  check('name', 'الاسم يجب أن يكون بين 2 و 50 حرفًا')
    .optional().isLength({ min: 2, max: 50 }),
  check('phone', 'رقم الهاتف غير صالح')
    .optional().isMobilePhone('ar-SA'),
  check('email', 'البريد الإلكتروني غير صالح')
    .optional().isEmail()
];

// قواعد التحقق للعناوين
const addressValidationRules = [
  check('label', 'اسم العنوان مطلوب').notEmpty(),
  check('address', 'العنوان مطلوب').notEmpty(),
  check('coordinates.lat', 'خط العرض يجب أن يكون رقمًا')
    .optional().isFloat(),
  check('coordinates.lng', 'خط الطول يجب أن يكون رقمًا')
    .optional().isFloat()
];

module.exports = {
  validate,
  authValidationRules,
  orderValidationRules,
  menuValidationRules,
  profileValidationRules,
  addressValidationRules
};