const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// التحقق من وجود توكن صالح
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // التحقق من وجود توكن في الهيدر
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // استخراج التوكن من الهيدر
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // استخراج التوكن من الكوكيز
      token = req.cookies.token;
    }
    
    // التحقق من وجود التوكن
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح بالوصول، يرجى تسجيل الدخول'
      });
    }
    
    try {
      // فك تشفير التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // إضافة المستخدم للطلب
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'توكن غير صالح'
      });
    }
  } catch (error) {
    console.error('خطأ في المصادقة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في المصادقة'
    });
  }
};

// التحقق من صلاحيات المسؤول
exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'غير مصرح بالوصول، يتطلب صلاحيات مسؤول'
    });
  }
};

// التحقق من صلاحيات موظفي المطبخ
exports.kitchenStaff = (req, res, next) => {
  if (req.user && (req.user.isKitchenStaff || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'غير مصرح بالوصول، يتطلب صلاحيات موظف مطبخ'
    });
  }
};

// التحقق من صلاحيات مندوبي التوصيل
exports.deliveryAgent = (req, res, next) => {
  if (req.user && (req.user.isDeliveryAgent || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'غير مصرح بالوصول، يتطلب صلاحيات مندوب توصيل'
    });
  }
};