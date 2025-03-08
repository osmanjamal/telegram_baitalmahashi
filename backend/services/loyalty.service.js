const User = require('../models/User.model');
const Notification = require('../models/Notification.model');

class LoyaltyService {
  /**
   * إضافة نقاط ولاء لمستخدم بناءً على طلب
   * @param {String} userId معرف المستخدم
   * @param {Number} orderAmount مبلغ الطلب
   * @returns {Promise<Object>} معلومات النقاط المضافة
   */
  static async addPointsForOrder(userId, orderAmount) {
    try {
      // البحث عن المستخدم
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }
      
      // حساب النقاط (نقطة واحدة لكل 10 ريال)
      const pointsToAdd = Math.floor(orderAmount / 10);
      
      // معدل مضاعفة النقاط حسب مستوى العضوية
      let multiplier = 1;
      
      if (user.membershipLevel === 'silver') {
        multiplier = 1.2;
      } else if (user.membershipLevel === 'gold') {
        multiplier = 1.5;
      } else if (user.membershipLevel === 'platinum') {
        multiplier = 2;
      }
      
      // حساب النقاط النهائية
      const finalPoints = Math.floor(pointsToAdd * multiplier);
      
      // إضافة النقاط للمستخدم
      user.loyaltyPoints += finalPoints;
      user.totalPointsEarned += finalPoints;
      
      // تحديث مستوى العضوية
      user.updateLoyaltyInfo();
      
      // حفظ التغييرات
      await user.save();
      
      // إنشاء إشعار للمستخدم
      if (finalPoints > 0) {
        await Notification.create({
          user: userId,
          title: 'نقاط ولاء جديدة',
          message: `تم إضافة ${finalPoints} نقطة ولاء إلى حسابك!`,
          type: 'loyalty'
        });
      }
      
      return {
        pointsAdded: finalPoints,
        currentPoints: user.loyaltyPoints,
        totalPointsEarned: user.totalPointsEarned,
        membershipLevel: user.membershipLevel
      };
    } catch (error) {
      console.error('خطأ في إضافة نقاط الولاء:', error);
      throw error;
    }
  }
  
  /**
   * استخدام نقاط ولاء للحصول على خصم
   * @param {String} userId معرف المستخدم
   * @param {Number} pointsToRedeem النقاط المراد استخدامها
   * @returns {Promise<Object>} معلومات الاسترداد
   */
  static async redeemPoints(userId, pointsToRedeem) {
    try {
      // البحث عن المستخدم
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }
      
      // التحقق من وجود نقاط كافية
      if (user.loyaltyPoints < pointsToRedeem) {
        throw new Error('نقاط الولاء غير كافية');
      }
      
      // حساب قيمة الخصم (1 ريال لكل 10 نقاط)
      const discountAmount = Math.floor(pointsToRedeem / 10);
      
      // خصم النقاط من المستخدم
      user.loyaltyPoints -= pointsToRedeem;
      
      // حفظ التغييرات
      await user.save();
      
      // إنشاء إشعار للمستخدم
      await Notification.create({
        user: userId,
        title: 'استبدال نقاط الولاء',
        message: `تم استبدال ${pointsToRedeem} نقطة ولاء مقابل خصم بقيمة ${discountAmount} ريال!`,
        type: 'loyalty'
      });
      
      return {
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        currentPoints: user.loyaltyPoints
      };
    } catch (error) {
      console.error('خطأ في استبدال نقاط الولاء:', error);
      throw error;
    }
  }
  
  /**
   * الحصول على معلومات برنامج الولاء للمستخدم
   * @param {String} userId معرف المستخدم
   * @returns {Promise<Object>} معلومات برنامج الولاء
   */
  static async getUserLoyalty(userId) {
    try {
      // البحث عن المستخدم
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }
      
      // حساب النقاط المطلوبة للمستوى التالي
      let pointsToNextLevel = 0;
      let nextLevel = '';
      
      if (user.membershipLevel === 'bronze') {
        pointsToNextLevel = 2000 - user.totalPointsEarned;
        nextLevel = 'silver';
      } else if (user.membershipLevel === 'silver') {
        pointsToNextLevel = 5000 - user.totalPointsEarned;
        nextLevel = 'gold';
      } else if (user.membershipLevel === 'gold') {
        pointsToNextLevel = 10000 - user.totalPointsEarned;
        nextLevel = 'platinum';
      } else {
        pointsToNextLevel = 0;
        nextLevel = 'platinum';
      }
      
      // المزايا حسب المستوى
      const benefits = this.getLevelBenefits(user.membershipLevel);
      
      return {
        currentPoints: user.loyaltyPoints,
        totalPointsEarned: user.totalPointsEarned,
        membershipLevel: user.membershipLevel,
        nextLevel: nextLevel !== user.membershipLevel ? nextLevel : null,
        pointsToNextLevel: Math.max(0, pointsToNextLevel),
        benefits
      };
    } catch (error) {
      console.error('خطأ في جلب معلومات برنامج الولاء:', error);
      throw error;
    }
  }
  
  /**
   * الحصول على تاريخ نقاط الولاء
   * @param {String} userId معرف المستخدم
   * @returns {Promise<Array>} تاريخ نقاط الولاء
   */
  static async getPointsHistory(userId) {
    try {
      // يمكن تخزين تاريخ النقاط في نموذج منفصل في التطبيق الحقيقي
      // في هذا المثال، سنسترجع بيانات وهمية
      
      return [
        {
          type: 'earned',
          points: 25,
          description: 'طلب #123456',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'earned',
          points: 30,
          description: 'طلب #123457',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'redeemed',
          points: -50,
          description: 'خصم على طلب #123458',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];
    } catch (error) {
      console.error('خطأ في جلب تاريخ نقاط الولاء:', error);
      throw error;
    }
  }
  
  /**
   * الحصول على الكوبونات المتاحة للمستخدم
   * @param {String} userId معرف المستخدم
   * @returns {Promise<Array>} الكوبونات المتاحة
   */
  static async getAvailableCoupons(userId) {
    try {
      // البحث عن المستخدم
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }
      
      // الكوبونات المتاحة حسب مستوى العضوية
      const coupons = [];
      
      // كوبونات لجميع المستويات
      coupons.push({
        code: 'WELCOME10',
        discount: '10%',
        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'خصم 10% على طلبك الأول'
      });
      
      // كوبونات إضافية حسب المستوى
      if (['silver', 'gold', 'platinum'].includes(user.membershipLevel)) {
        coupons.push({
          code: 'SILVER15',
          discount: '15%',
          expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          description: 'خصم 15% على طلبك التالي'
        });
      }
      
      if (['gold', 'platinum'].includes(user.membershipLevel)) {
        coupons.push({
          code: 'GOLD20',
          discount: '20%',
          expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          description: 'خصم 20% على طلبك التالي'
        });
      }
      
      if (user.membershipLevel === 'platinum') {
        coupons.push({
          code: 'PLATINUM25',
          discount: '25%',
          expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          description: 'خصم 25% على طلبك التالي'
        });
      }
      
      return coupons;
    } catch (error) {
      console.error('خطأ في جلب الكوبونات المتاحة:', error);
      throw error;
    }
  }
  
  /**
   * الحصول على مزايا المستوى
   * @param {String} level مستوى العضوية
   * @returns {Array} قائمة المزايا
   */
  static getLevelBenefits(level) {
    const benefits = {
      bronze: [
        'نقطة واحدة لكل 10 ريال',
        'تراكم النقاط واستبدالها'
      ],
      silver: [
        '1.2 نقطة لكل 10 ريال',
        'خصم 5% على طلبات التوصيل',
        'كوبون شهري بخصم 15%'
      ],
      gold: [
        '1.5 نقطة لكل 10 ريال',
        'خصم 10% على طلبات التوصيل',
        'كوبون شهري بخصم 20%',
        'أولوية في تحضير الطلبات'
      ],
      platinum: [
        'ضعف النقاط لكل طلب',
        'توصيل مجاني دائمًا',
        'كوبون شهري بخصم 25%',
        'أولوية قصوى في تحضير الطلبات',
        'خدمة عملاء VIP'
      ]
    };
    
    return benefits[level] || [];
  }
}

module.exports = LoyaltyService;