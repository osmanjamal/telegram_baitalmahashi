const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب']
  },
  telegramId: {
    type: String,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    select: false,
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل']
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'يرجى إدخال بريد إلكتروني صالح'
    ],
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  addresses: [
    {
      label: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      coordinates: {
        lat: Number,
        lng: Number
      },
      buildingNumber: String,
      floorNumber: String,
      apartmentNumber: String,
      isDefault: {
        type: Boolean,
        default: false
      }
    }
  ],
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  ],
  favourites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }
  ],
  isAdmin: {
    type: Boolean,
    default: false
  },
  isKitchenStaff: {
    type: Boolean,
    default: false
  },
  isDeliveryAgent: {
    type: Boolean,
    default: false
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  membershipLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    telegram: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    promotions: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // إذا لم يتم تعديل كلمة المرور
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  // تشفير كلمة المرور
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// مقارنة كلمة المرور
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// توليد توكن JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// توليد توكن إعادة تعيين كلمة المرور
UserSchema.methods.getResetPasswordToken = function() {
  // توليد توكن
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // تشفير التوكن وتخزينه في قاعدة البيانات
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // تعيين مدة صلاحية التوكن (10 دقائق)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// دالة لتحديث معلومات برنامج الولاء
UserSchema.methods.updateLoyaltyInfo = function() {
  // تحديث مستوى العضوية بناءً على النقاط المكتسبة
  if (this.totalPointsEarned >= 10000) {
    this.membershipLevel = 'platinum';
  } else if (this.totalPointsEarned >= 5000) {
    this.membershipLevel = 'gold';
  } else if (this.totalPointsEarned >= 2000) {
    this.membershipLevel = 'silver';
  } else {
    this.membershipLevel = 'bronze';
  }
  
  return this;
};

// دالة لإضافة نقاط الولاء
UserSchema.methods.addLoyaltyPoints = async function(points) {
  this.loyaltyPoints += points;
  this.totalPointsEarned += points;
  
  // تحديث مستوى العضوية
  this.updateLoyaltyInfo();
  
  await this.save();
  return this;
};

// إنشاء فهرس للبحث
UserSchema.index({ name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('User', UserSchema);