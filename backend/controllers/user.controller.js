const User = require('../models/User.model');
const Order = require('../models/Order.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LoyaltyService = require('../services/loyalty.service');

// الحصول على الملف الشخصي للمستخدم
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // جلب معلومات برنامج الولاء
    const loyaltyInfo = await LoyaltyService.getUserLoyalty(user._id);
    
    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        loyalty: loyaltyInfo
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الملف الشخصي'
    });
  }
};

// تحديث الملف الشخصي للمستخدم
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    // البحث عن المستخدم
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // تحديث البيانات
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        telegramId: user.telegramId
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الملف الشخصي'
    });
  }
};

// إضافة عنوان جديد
exports.addAddress = async (req, res) => {
  try {
    const { label, address, coordinates } = req.body;
    
    if (!label || !address) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والعنوان مطلوبان'
      });
    }
    
    // البحث عن المستخدم
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // إضافة العنوان الجديد
    user.addresses.push({
      label,
      address,
      coordinates: coordinates || null
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة العنوان بنجاح',
      data: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error('خطأ في إضافة العنوان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة العنوان'
    });
  }
};

// حذف عنوان
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    // البحث عن المستخدم
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // البحث عن العنوان
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'العنوان غير موجود'
      });
    }
    
    // حذف العنوان
    user.addresses.splice(addressIndex, 1);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'تم حذف العنوان بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف العنوان:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف العنوان'
    });
  }
};

// الحصول على معلومات برنامج الولاء
exports.getLoyaltyInfo = async (req, res) => {
  try {
    // جلب معلومات برنامج الولاء
    const loyaltyInfo = await LoyaltyService.getUserLoyalty(req.user.id);
    
    // جلب تاريخ النقاط
    const pointsHistory = await LoyaltyService.getPointsHistory(req.user.id);
    
    // جلب الكوبونات المتاحة
    const availableCoupons = await LoyaltyService.getAvailableCoupons(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        currentPoints: loyaltyInfo.currentPoints,
        totalPointsEarned: loyaltyInfo.totalPointsEarned,
        membershipLevel: loyaltyInfo.membershipLevel,
        pointsToNextLevel: loyaltyInfo.pointsToNextLevel,
        pointsHistory,
        availableCoupons
      }
    });
  } catch (error) {
    console.error('خطأ في جلب معلومات برنامج الولاء:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معلومات برنامج الولاء'
    });
  }
};

// الحصول على جميع المستخدمين (للمسؤولين فقط)
exports.getAllUsers = async (req, res) => {
  try {
    // التحقق من صلاحيات المسؤول
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);
    
    const totalUsers = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count: users.length,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين'
    });
  }
};

// الحصول على إحصائيات المستخدم
exports.getUserStats = async (req, res) => {
  try {
    // جلب معلومات الطلبات
    const orders = await Order.find({ user: req.user.id });
    
    // حساب الإحصائيات
    const stats = {
      totalOrders: orders.length,
      completedOrders: orders.filter(order => 
        ['delivered', 'picked-up'].includes(order.status)
      ).length,
      cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
      totalSpent: orders.reduce((total, order) => {
        if (['delivered', 'picked-up'].includes(order.status)) {
          return total + order.totalPrice;
        }
        return total;
      }, 0),
      favouriteItems: []
    };
    
    // حساب العناصر المفضلة
    const itemCounts = {};
    
    for (const order of orders) {
      if (['delivered', 'picked-up'].includes(order.status)) {
        for (const item of order.items) {
          const itemId = item.menuItem.toString();
          if (itemCounts[itemId]) {
            itemCounts[itemId] += item.quantity;
          } else {
            itemCounts[itemId] = item.quantity;
          }
        }
      }
    }
    
    // ترتيب العناصر حسب الشعبية
    const sortedItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // جلب تفاصيل العناصر المفضلة
    const favouriteItemIds = sortedItems.map(item => item[0]);
    
    if (favouriteItemIds.length > 0) {
      const MenuItem = require('../models/MenuItem.model');
      const favouriteItemDetails = await MenuItem.find({
        _id: { $in: favouriteItemIds }
      }).select('name image category');
      
      stats.favouriteItems = favouriteItemDetails.map(item => ({
        _id: item._id,
        name: item.name,
        image: item.image,
        category: item.category,
        orderCount: itemCounts[item._id.toString()]
      }));
    }
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات المستخدم'
    });
  }
};