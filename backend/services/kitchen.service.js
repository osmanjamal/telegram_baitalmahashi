const Order = require('../models/Order.model');
const NotificationService = require('./notification.service');

class KitchenService {
  /**
   * الحصول على متوسط وقت التحضير لكل فئة
   * @returns {Promise<Object>} متوسط وقت التحضير لكل فئة
   */
  static async getAveragePrepTimeByCategory() {
    try {
      // البحث عن الطلبات المكتملة
      const completedOrders = await Order.find({
        status: { $in: ['ready', 'delivered', 'picked-up'] }
      })
        .populate('items.menuItem', 'category')
        .lean();
      
      // تجميع أوقات التحضير حسب الفئة
      const prepTimeByCategory = {};
      let orderCount = 0;
      
      for (const order of completedOrders) {
        orderCount++;
        
        // البحث عن وقت التحضير من سجل الحالات
        const readyStatus = order.statusHistory.find(h => h.status === 'ready');
        const confirmedStatus = order.statusHistory.find(h => h.status === 'confirmed');
        
        if (readyStatus && confirmedStatus) {
          const prepTimeMinutes = Math.round(
            (new Date(readyStatus.timestamp) - new Date(confirmedStatus.timestamp)) / 60000
          );
          
          // تجميع أوقات التحضير حسب الفئة
          for (const item of order.items) {
            if (item.menuItem && item.menuItem.category) {
              const categoryId = item.menuItem.category.toString();
              
              if (!prepTimeByCategory[categoryId]) {
                prepTimeByCategory[categoryId] = {
                  totalTime: 0,
                  orderCount: 0
                };
              }
              
              prepTimeByCategory[categoryId].totalTime += prepTimeMinutes;
              prepTimeByCategory[categoryId].orderCount++;
            }
          }
        }
      }
      
      // حساب المتوسط لكل فئة
      const averagePrepTimeByCategory = {};
      
      for (const [categoryId, data] of Object.entries(prepTimeByCategory)) {
        averagePrepTimeByCategory[categoryId] = Math.round(
          data.totalTime / data.orderCount
        );
      }
      
      return {
        averagePrepTimeByCategory,
        totalOrdersAnalyzed: orderCount
      };
    } catch (error) {
      console.error('خطأ في حساب متوسط وقت التحضير:', error);
      throw error;
    }
  }
  
  /**
   * التنبؤ بوقت التحضير المتوقع لطلب
   * @param {Object} order كائن الطلب
   * @returns {Promise<Number>} وقت التحضير المتوقع بالدقائق
   */
  static async predictPreparationTime(order) {
    try {
      const avgPrepTimeByCategory = await this.getAveragePrepTimeByCategory();
      let totalPrepTime = 0;
      let itemCount = 0;
      
      // حساب وقت التحضير لكل عنصر
      for (const item of order.items) {
        const menuItem = await MenuItem.findById(item.menuItem).populate('category');
        
        if (menuItem) {
          const categoryId = menuItem.category._id.toString();
          const avgCategoryPrepTime = avgPrepTimeByCategory.averagePrepTimeByCategory[categoryId] || 15;
          
          // زيادة وقت التحضير بناءً على الكمية والخيارات
          let itemPrepTime = avgCategoryPrepTime * item.quantity;
          
          // إضافة وقت إضافي للخيارات الخاصة
          if (item.options && item.options.length > 0) {
            itemPrepTime += 2 * item.options.length;
          }
          
          totalPrepTime += itemPrepTime;
          itemCount++;
        }
      }
      
      // حساب المتوسط وإضافة وقت إضافي للطلبات الكبيرة
      const basePrepTime = itemCount > 0 ? Math.round(totalPrepTime / itemCount) : 15;
      const orderSize = order.items.reduce((total, item) => total + item.quantity, 0);
      
      // إضافة وقت إضافي للطلبات الكبيرة (أكثر من 5 عناصر)
      const extraTime = orderSize > 5 ? Math.round((orderSize - 5) * 2) : 0;
      
      // الوقت الإجمالي المتوقع
      const totalEstimatedTime = basePrepTime + extraTime;
      
      return Math.max(10, Math.min(totalEstimatedTime, 60)); // بين 10 و 60 دقيقة
    } catch (error) {
      console.error('خطأ في التنبؤ بوقت التحضير:', error);
      return 20; // وقت افتراضي في حالة الخطأ
    }
  }
  
  /**
   * تنبيه المطبخ بطلب جديد
   * @param {Object} order كائن الطلب
   */
  static async notifyNewOrder(order) {
    try {
      // إضافة رنين في واجهة المطبخ (سيتم تنفيذه من خلال WebSockets)
      
      // إرسال إشعار بريد إلكتروني لفريق المطبخ
      await NotificationService.sendEmailToKitchen(order);
      
      return true;
    } catch (error) {
      console.error('خطأ في تنبيه المطبخ:', error);
      return false;
    }
  }
  
  /**
   * إعادة ترتيب الطلبات حسب الأولوية
   * @returns {Promise<Array>} قائمة الطلبات المرتبة
   */
  static async prioritizeOrders() {
    try {
      // جلب الطلبات النشطة
      const activeOrders = await Order.find({
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      }).sort('createdAt');
      
      // حساب نقاط الأولوية لكل طلب
      const prioritizedOrders = activeOrders.map(order => {
        let priorityScore = 0;
        
        // العامل 1: وقت الانتظار (أقدم الطلبات تحصل على أولوية أعلى)
        const waitingTime = Date.now() - new Date(order.createdAt).getTime();
        priorityScore += Math.floor(waitingTime / (5 * 60 * 1000)); // 5 نقاط لكل 5 دقائق
        
        // العامل 2: حالة الطلب
        if (order.status === 'confirmed') priorityScore += 10;
        if (order.status === 'preparing') priorityScore += 5;
        
        // العامل 3: طريقة التوصيل (الاستلام من المطعم له أولوية)
        if (order.deliveryMethod === 'pickup') priorityScore += 15;
        
        // العامل 4: حجم الطلب (الطلبات الصغيرة لها أولوية)
        const orderSize = order.items.reduce((total, item) => total + item.quantity, 0);
        priorityScore -= orderSize; // خصم نقطة لكل عنصر
        
        // العامل 5: مستوى عضوية العميل
        if (order.user && order.user.membershipLevel) {
          if (order.user.membershipLevel === 'platinum') priorityScore += 15;
          else if (order.user.membershipLevel === 'gold') priorityScore += 10;
          else if (order.user.membershipLevel === 'silver') priorityScore += 5;
        }
        
        return {
          order,
          priorityScore
        };
      });
      
      // ترتيب الطلبات حسب الأولوية
      return prioritizedOrders.sort((a, b) => b.priorityScore - a.priorityScore);
    } catch (error) {
      console.error('خطأ في ترتيب الطلبات:', error);
      throw error;
    }
  }
}

module.exports = KitchenService;