const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'المبلغ مطلوب'],
    min: [0, 'يجب أن يكون المبلغ موجبًا']
  },
  currency: {
    type: String,
    default: 'SAR'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  sessionId: {
    type: String
  },
  transactionId: {
    type: String
  },
  errorMessage: {
    type: String
  },
  refundId: {
    type: String
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  refundedAmount: {
    type: Number,
    min: 0
  },
  paymentDate: {
    type: Date
  },
  paymentDetails: {
    cardBrand: String,
    last4: String,
    expiryMonth: String,
    expiryYear: String
  },
  receiptUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// تحديث timestamp عند التعديل
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // إذا تم تغيير الحالة إلى 'succeeded'، تحديث paymentDate
  if (this.isModified('status') && this.status === 'succeeded' && !this.paymentDate) {
    this.paymentDate = Date.now();
  }
  
  // إذا تم تغيير الحالة إلى 'refunded'، تحديث refundedAt
  if (this.isModified('status') && this.status === 'refunded' && !this.refundedAt) {
    this.refundedAt = Date.now();
  }
  
  next();
});

// دالة للقيام بعملية استرداد
PaymentSchema.methods.refund = async function(amount, reason) {
  // التحقق من أن المبلغ المسترد لا يتجاوز المبلغ الأصلي
  if (amount > this.amount) {
    throw new Error('مبلغ الاسترداد لا يمكن أن يتجاوز المبلغ الأصلي');
  }
  
  // تحديث بيانات الاسترداد
  this.status = amount === this.amount ? 'refunded' : 'partially_refunded';
  this.refundedAmount = amount;
  this.refundReason = reason;
  this.refundedAt = Date.now();
  
  return await this.save();
};

module.exports = mongoose.model('Payment', PaymentSchema);