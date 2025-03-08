const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم العنصر مطلوب'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'سعر العنصر مطلوب'],
    min: [0, 'يجب أن يكون السعر موجبًا']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'الفئة مطلوبة']
  },
  image: {
    type: String
  },
  options: [
    {
      name: {
        type: String,
        required: true
      },
      required: {
        type: Boolean,
        default: false
      },
      multiSelect: {
        type: Boolean,
        default: false
      },
      choices: [
        {
          name: {
            type: String,
            required: true
          },
          price: {
            type: Number,
            default: 0
          }
        }
      ]
    }
  ],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  ingredients: [String],
  allergens: [String],
  prepTime: {
    type: Number, // بالدقائق
    default: 15
  },
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  spicyLevel: {
    type: Number,
    min: 0,
    max: 3,
    default: 0
  },
  vegan: {
    type: Boolean,
    default: false
  },
  vegetarian: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [String],
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
MenuItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// إنشاء فهرس للبحث
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('MenuItem', MenuItemSchema);