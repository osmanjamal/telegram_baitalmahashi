const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'عنوان الإشعار مطلوب']
  },
  message: {
    type: String,
    required: [true, 'محتوى الإشعار مطلوب']
  },
  type: {
    type: String,
    enum: ['order', 'promotion', 'system', 'loyalty'],
    default: 'system'
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['Order', 'MenuItem', 'User'],
    default: 'User'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  telegramMessageId: {
    type: String
  },
  action: {
    type: {
      type: String,
      enum: ['link', 'button', 'none'],
      default: 'none'
    },
    data: {
      type: String
    },
    label: {
      type: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// تعيين تاريخ القراءة عند تغيير حالة القراءة
NotificationSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = Date.now();
  }
  
  if (this.isModified('delivered') && this.delivered && !this.deliveredAt) {
    this.deliveredAt = Date.now();
  }
  
  next();
});

// دالة لتحديد حالة القراءة
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = Date.now();
  await this.save();
  return this;
};

// دالة لتحديد حالة التوصيل
NotificationSchema.methods.markAsDelivered = async function(messageId) {
  this.delivered = true;
  this.deliveredAt = Date.now();
  
  if (messageId) {
    this.telegramMessageId = messageId;
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model('Notification', NotificationSchema);