const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// إنشاء توكن JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// المصادقة عبر تلغرام
exports.telegramAuth = async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;
    
    // التحقق من صحة البيانات
    if (!id || !auth_date || !hash) {
      return res.status(400).json({
        success: false,
        message: 'بيانات المصادقة غير مكتملة'
      });
    }
    
    // التحقق من التوقيع (في بيئة إنتاج حقيقية يجب التحقق)
    
    // البحث عن المستخدم أو إنشاء مستخدم جديد
    let user = await User.findOne({ telegramId: id.toString() });
    
    if (!user) {
      user = new User({
        telegramId: id.toString(),
        name: first_name + (last_name ? ' ' + last_name : ''),
        username: username || '',
        avatar: photo_url || ''
      });
      await user.save();
    } else {
      // تحديث معلومات المستخدم
      user.name = first_name + (last_name ? ' ' + last_name : '');
      user.username = username || user.username;
      user.avatar = photo_url || user.avatar;
      await user.save();
    }
    
    // إنشاء وإرسال التوكن
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        telegramId: user.telegramId,
        username: user.username,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('خطأ في المصادقة عبر تلغرام:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في المصادقة'
    });
  }
};

// تسجيل الدخول للوحة الإدارة
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // التحقق من وجود المستخدم
    const user = await User.findOne({ username, isAdmin: true });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }
    
    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }
    
    // إنشاء وإرسال التوكن
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل دخول المدير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الدخول'
    });
  }
};

// تسجيل دخول المطبخ
exports.kitchenLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // التحقق من وجود المستخدم
    const user = await User.findOne({ username, isKitchenStaff: true });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }
    
    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }
    
    // إنشاء وإرسال التوكن
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        isKitchenStaff: user.isKitchenStaff
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل دخول المطبخ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الدخول'
    });
  }
};

// التحقق من مستخدم مصرح به
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        telegramId: user.telegramId,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        isKitchenStaff: user.isKitchenStaff
      }
    });
  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معلومات المستخدم'
    });
  }
};