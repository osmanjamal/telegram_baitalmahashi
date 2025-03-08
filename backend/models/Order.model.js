const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0
      },
      options: [
        {
          name: {
            type: String,
            required: true
          },
          choice: {
            type: String,
            required: true
          },
          price: {
            type: Number,
            default: 0
          }
        }
      ],
      specialInstructions: {
        type: String,
        default: ''
      }
    }
  ],
  deliveryMethod: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: true
  },
  deliveryAddress: {
    address: {
      type: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    buildingNumber: String,
    floorNumber: String,
    apartmentNumber: String,
    landmark: String
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  deliveryTime: {
    type: Date
  },
  deliveryAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryAgent'
  },
  estimatedPreparationTime: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    paymentMethod: String,
    refundId: String,
    refundReason: String,
    refundedAt: Date,
    sessionId: String
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'picked-up', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      note: {
        type: String,
        default: ''
      }
    }
  ],
  deliveredAt: {
    type: Date
  },
  couponCode: {
    type: String
  },
  discount: {
    type: Number,
    default: 0
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  ratings: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    experience: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
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
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // إذا تم تغيير الحالة إلى 'delivered'، تحديث deliveredAt
  if (this.isModified('status') && this.status === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = Date.now();
  }
  
  next();
});

// دالة لحساب إجمالي سعر الطلب
OrderSchema.methods.calculateTotalPrice = function() {
  let totalPrice = 0;
  
  // حساب أسعار العناصر
  for (const item of this.items) {
    totalPrice += item.totalPrice;
  }
  
  // إضافة رسوم التوصيل
  totalPrice += this.deliveryFee;
  
  // خصم الخصومات
  totalPrice -= this.discount;
  
  return totalPrice;
};

// دالة لإضافة عنصر للطلب
OrderSchema.methods.addItem = function(menuItem, quantity, options = [], specialInstructions = '') {
  const itemPrice = menuItem.price;
  let totalItemPrice = itemPrice * quantity;
  
  // حساب أسعار الخيارات الإضافية
  const selectedOptions = [];
  
  for (const option of options) {
    const menuOption = menuItem.options.find(o => o.name === option.name);
    
    if (menuOption) {
      const choice = menuOption.choices.find(c => c.name === option.choice);
      
      if (choice) {
        const optionPrice = choice.price || 0;
        totalItemPrice += optionPrice * quantity;
        
        selectedOptions.push({
          name: option.name,
          choice: option.choice,
          price: optionPrice
        });
      }
    }
  }
  
  // إضافة العنصر للطلب
  this.items.push({
    menuItem: menuItem._id,
    quantity,
    price: itemPrice,
    totalPrice: totalItemPrice,
    options: selectedOptions,
    specialInstructions
  });
  
  // إعادة حساب إجمالي الطلب
  this.totalPrice = this.calculateTotalPrice();
  
  return this;
};

module.exports = mongoose.model('Order', OrderSchema);