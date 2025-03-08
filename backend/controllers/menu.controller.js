const MenuItem = require('../models/MenuItem.model');
const Category = require('../models/Category.model');
const fs = require('fs');
const path = require('path');

// الحصول على جميع فئات القائمة
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('order');
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('خطأ في جلب فئات القائمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب فئات القائمة'
    });
  }
};

// إنشاء فئة جديدة
exports.createCategory = async (req, res) => {
  try {
    const { name, description, order } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم الفئة مطلوب'
      });
    }
    
    // التحقق من عدم تكرار الاسم
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'يوجد فئة بهذا الاسم بالفعل'
      });
    }
    
    // إنشاء الفئة
    const category = new Category({
      name,
      description: description || '',
      order: order || 0
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('خطأ في إنشاء الفئة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الفئة'
    });
  }
};

// الحصول على عناصر القائمة حسب الفئة
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // التحقق من وجود الفئة
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }
    
    // جلب عناصر القائمة المرتبطة بالفئة
    const menuItems = await MenuItem.find({ category: categoryId }).sort('order');
    
    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('خطأ في جلب عناصر القائمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب عناصر القائمة'
    });
  }
};

// الحصول على جميع عناصر القائمة
exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find()
      .populate('category', 'name')
      .sort('category order');
    
    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('خطأ في جلب جميع عناصر القائمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب جميع عناصر القائمة'
    });
  }
};

// إنشاء عنصر قائمة جديد
exports.createMenuItem = async (req, res) => {
  try {
    const {
      name, description, price, category,
      options, available, order
    } = req.body;
    
    // التحقق من البيانات الإلزامية
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'الاسم، السعر والفئة مطلوبة'
      });
    }
    
    // التحقق من وجود الفئة
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }
    
    // معالجة الصورة إذا تم تحميلها
    let imagePath = null;
    if (req.file) {
      imagePath = `/assets/images/menu/${req.file.filename}`;
    }
    
    // إنشاء عنصر القائمة
    const menuItem = new MenuItem({
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      image: imagePath,
      options: options ? JSON.parse(options) : [],
      available: available !== undefined ? available : true,
      order: order || 0
    });
    
    await menuItem.save();
    
    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('خطأ في إنشاء عنصر القائمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء عنصر القائمة'
    });
  }
};

// تحديث عنصر قائمة
exports.updateMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const {
      name, description, price, category,
      options, available, order
    } = req.body;
    
    // البحث عن عنصر القائمة
    const menuItem = await MenuItem.findById(menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'عنصر القائمة غير موجود'
      });
    }
    
    // التحقق من وجود الفئة إذا تم تحديثها
    if (category && category !== menuItem.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'الفئة غير موجودة'
        });
      }
    }
    
    // معالجة الصورة إذا تم تحميلها
    let imagePath = menuItem.image;
    if (req.file) {
      // حذف الصورة القديمة إذا كانت موجودة
      if (menuItem.image) {
        const oldImagePath = path.join(__dirname, '../../', menuItem.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      imagePath = `/assets/images/menu/${req.file.filename}`;
    }
    
    // تحديث عنصر القائمة
    menuItem.name = name || menuItem.name;
    menuItem.description = description !== undefined ? description : menuItem.description;
    menuItem.price = price ? parseFloat(price) : menuItem.price;
    menuItem.category = category || menuItem.category;
    menuItem.image = imagePath;
    menuItem.options = options ? JSON.parse(options) : menuItem.options;
    menuItem.available = available !== undefined ? available : menuItem.available;
    menuItem.order = order !== undefined ? order : menuItem.order;
    
    await menuItem.save();
    
    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('خطأ في تحديث عنصر القائمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث عنصر القائمة'
    });
  }
};

// حذف عنصر قائمة
exports.deleteMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    // البحث عن عنصر القائمة
    const menuItem = await MenuItem.findById(menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'عنصر القائمة غير موجود'
      });
    }
    
    // حذف الصورة إذا كانت موجودة
    if (menuItem.image) {
      const imagePath = path.join(__dirname, '../../', menuItem.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // حذف عنصر القائمة
    await menuItem.remove();
    
    res.status(200).json({
      success: true,
      message: 'تم حذف عنصر القائمة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف عنصر القائمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف عنصر القائمة'
    });
  }
};

// الحصول على العناصر المميزة
exports.getFeaturedItems = async (req, res) => {
  try {
    const featuredItems = await MenuItem.find({ featured: true, available: true })
      .populate('category', 'name')
      .limit(8);
    
    res.status(200).json({
      success: true,
      count: featuredItems.length,
      data: featuredItems
    });
  } catch (error) {
    console.error('خطأ في جلب العناصر المميزة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب العناصر المميزة'
    });
  }
};