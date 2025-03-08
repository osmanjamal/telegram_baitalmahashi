const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const telegramBot = require('../telegram-bot');
const nodemailer = require('nodemailer');

class NotificationService {
  /**
   * إرسال إشعار عبر تلغرام
   * @param {String} telegramId معرف تلغرام للمستخدم
   * @param {String} message نص الرسالة
   * @returns {Promise<Object>} نتيجة الإرسال
   */
  static async sendTelegramMessage(telegramId, message) {
    try {
      if (!telegramId) {
        throw new Error('معرف تلغرام غير موجود');
      }
      
      const result = await telegramBot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown'
      });
      
      return {
        success: true,
        messageId: result.message_id
      };
    } catch (error) {
      console.error('خطأ في إرسال رسالة تلغرام:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * إرسال بريد إلكتروني
   * @param {String} email البريد الإلكتروني
   * @param {String} subject عنوان البريد
   * @param {String} htmlContent محتوى البريد
   * @returns {Promise<Object>} نتيجة الإرسال
   */
  static async sendEmail(email, subject, htmlContent) {
    try {
      // إعداد ناقل البريد
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      // إرسال البريد
      const result = await transporter.sendMail({
        from: `"بيت المحاشي" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject,
        html: htmlContent
      });
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('خطأ في إرسال البريد الإلكتروني:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * إنشاء إشعار وإرساله عبر القنوات المختلفة
   * @param {String} userId معرف المستخدم
   * @param {Object} notificationData بيانات الإشعار
   * @returns {Promise<Object>} الإشعار المنشأ
   */
  static async createAndSendNotification(userId, notificationData) {
    try {
      // البحث عن المستخدم
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }
      
      // إنشاء الإشعار في قاعدة البيانات
      const notification = await Notification.create({
        user: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'system',
        relatedTo: notificationData.relatedTo,
        onModel: notificationData.onModel,
        action: notificationData.action
      });
      
      // إرسال الإشعار عبر تلغرام إذا كان مفعلاً
      if (user.notifications.telegram && user.telegramId) {
        const telegramResult = await this.sendTelegramMessage(
          user.telegramId,
          `*${notificationData.title}*\n\n${notificationData.message}`
        );
        
        if (telegramResult.success) {
          notification.telegramMessageId = telegramResult.messageId;
          notification.delivered = true;
          notification.deliveredAt = Date.now();
        }
      }
      
      // إرسال الإشعار عبر البريد الإلكتروني إذا كان مفعلاً
      if (user.notifications.email && user.email) {
        await this.sendEmail(
          user.email,
          notificationData.title,
          `<h2>${notificationData.title}</h2><p>${notificationData.message}</p>`
        );
      }
      
      // حفظ التغييرات
      await notification.save();
      
      return notification;
    } catch (error) {
      console.error('خطأ في إنشاء وإرسال الإشعار:', error);
      throw error;
    }
  }
  
  /**
   * إرسال إشعار بتأكيد الطلب
   * @param {Object} order الطلب
   * @param {String} telegramId معرف تلغرام للمستخدم
   * @returns {Promise<Object>} نتيجة الإرسال
   */
  static async sendOrderConfirmation(order, telegramId) {
    try {
      // إعداد نص الرسالة
      let message = `✅ *تم استلام طلبك بنجاح!*\n\n`;
      message += `🧾 رقم الطلب: #${order._id.toString().slice(-6)}\n`;
      message += `📅 التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-SA')}\n\n`;
      
      message += `🍽️ العناصر:\n`;
      
      for (const item of order.items) {
        message += `- ${item.quantity}x ${item.menuItem.name || 'عنصر'} (${item.price} ريال)\n`;
      }
      
      message += `\n💰 الإجمالي: ${order.totalPrice} ريال\n`;
      message += `💳 طريقة الدفع: ${this.getPaymentMethodInArabic(order.paymentMethod)}\n`;
      message += `🚚 طريقة التوصيل: ${order.deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من المطعم'}\n\n`;
      
      message += `سنبدأ بتحضير طلبك قريبًا وسنبقيك على اطلاع بالمستجدات!`;
      
      // إرسال الرسالة عبر تلغرام
      return await this.sendTelegramMessage(telegramId, message);
    } catch (error) {
      console.error('خطأ في إرسال تأكيد الطلب:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * إرسال إشعار بتحديث حالة الطلب
   * @param {Object} order الطلب
   * @param {String} telegramId معرف تلغرام للمستخدم
   * @returns {Promise<Object>} نتيجة الإرسال
   */
  static async sendOrderStatusUpdate(order, telegramId) {
    try {
      // تحديد نص الرسالة حسب حالة الطلب
      let message = '';
      
      switch (order.status) {
        case 'confirmed':
          message = `✅ تم تأكيد طلبك رقم #${order._id.toString().slice(-6)} وسنبدأ بتحضيره الآن!`;
          break;
        case 'preparing':
          message = `👨‍🍳 جاري تحضير طلبك رقم #${order._id.toString().slice(-6)}`;
          break;
        case 'ready':
          if (order.deliveryMethod === 'pickup') {
            message = `🍽️ طلبك رقم #${order._id.toString().slice(-6)} جاهز للاستلام من المطعم.`;
          } else {
            message = `🍽️ تم تجهيز طلبك رقم #${order._id.toString().slice(-6)} وسيتم تعيين مندوب توصيل قريبًا.`;
          }
          break;
        case 'out-for-delivery':
          message = `🛵 طلبك رقم #${order._id.toString().slice(-6)} في الطريق إليك!`;
          break;
        case 'delivered':
          message = `🎉 تم توصيل طلبك رقم #${order._id.toString().slice(-6)}. بالهناء والشفاء!`;
          break;
        case 'picked-up':
          message = `🎉 تم استلام طلبك رقم #${order._id.toString().slice(-6)}. بالهناء والشفاء!`;
          break;
        case 'cancelled':
          message = `❌ تم إلغاء طلبك رقم #${order._id.toString().slice(-6)}`;
          break;
        default:
          message = `ℹ️ تم تحديث حالة طلبك رقم #${order._id.toString().slice(-6)} إلى: ${this.getOrderStatusInArabic(order.status)}`;
      }
      
      // إرسال الرسالة عبر تلغرام
      return await this.sendTelegramMessage(telegramId, message);
    } catch (error) {
      console.error('خطأ في إرسال تحديث حالة الطلب:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * إشعار المطبخ بطلب جديد
   * @param {Object} order الطلب
   * @returns {Promise<Boolean>} نجاح العملية
   */
  static async notifyKitchenNewOrder(order) {
    try {
      // يمكن إرسال بريد إلكتروني أو إشعار عبر تطبيق المطبخ
      // في المثال سنرسل بريد إلكتروني
      
      let emailContent = `
        <h2>طلب جديد!</h2>
        <p>رقم الطلب: #${order._id.toString().slice(-6)}</p>
        <p>التاريخ: ${new Date(order.createdAt).toLocaleString('ar-SA')}</p>
        <p>العميل: ${order.user.name || 'غير معروف'}</p>
        <h3>العناصر:</h3>
        <ul>
      `;
      
      for (const item of order.items) {
        emailContent += `<li>${item.quantity}x ${item.menuItem.name || 'عنصر'}</li>`;
      }
      
      emailContent += `
        </ul>
        <p>طريقة التوصيل: ${order.deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من المطعم'}</p>
        <p>الإجمالي: ${order.totalPrice} ريال</p>
        <p><a href="${process.env.KITCHEN_APP_URL || 'http://localhost:3000/kitchen'}">فتح لوحة المطبخ</a></p>
      `;
      
      // إرسال البريد لعنوان المطبخ
      await this.sendEmail(
        process.env.KITCHEN_EMAIL || 'kitchen@example.com',
        `طلب جديد: #${order._id.toString().slice(-6)}`,
        emailContent
      );
      
      return true;
    } catch (error) {
      console.error('خطأ في إشعار المطبخ بطلب جديد:', error);
      return false;
    }
  }
  
  /**
   * إشعار المطبخ بإلغاء طلب
   * @param {Object} order الطلب
   * @returns {Promise<Boolean>} نجاح العملية
   */
  static async notifyKitchenOrderCancelled(order) {
    try {
      // إرسال بريد إلكتروني للمطبخ
      const emailContent = `
        <h2>تم إلغاء طلب!</h2>
        <p>رقم الطلب: #${order._id.toString().slice(-6)}</p>
        <p>التاريخ: ${new Date().toLocaleString('ar-SA')}</p>
        <p>العميل: ${order.user.name || 'غير معروف'}</p>
        <p>سبب الإلغاء: ${order.statusHistory[order.statusHistory.length - 1].note || 'غير محدد'}</p>
        <p><a href="${process.env.KITCHEN_APP_URL || 'http://localhost:3000/kitchen'}">فتح لوحة المطبخ</a></p>
      `;
      
      // إرسال البريد لعنوان المطبخ
      await this.sendEmail(
        process.env.KITCHEN_EMAIL || 'kitchen@example.com',
        `إلغاء طلب: #${order._id.toString().slice(-6)}`,
        emailContent
      );
      
      return true;
    } catch (error) {
      console.error('خطأ في إشعار المطبخ بإلغاء طلب:', error);
      return false;
    }
  }
  
  /**
   * تحويل حالة الطلب للعربية
   * @param {String} status حالة الطلب
   * @returns {String} الحالة بالعربية
   */
  static getOrderStatusInArabic(status) {
    const statusMap = {
      'pending': 'قيد الانتظار',
      'confirmed': 'مؤكد',
      'preparing': 'قيد التحضير',
      'ready': 'جاهز',
      'out-for-delivery': 'في الطريق',
      'delivered': 'تم التسليم',
      'picked-up': 'تم الاستلام',
      'cancelled': 'ملغي'
    };
    
    return statusMap[status] || status;
  }
  
  /**
   * تحويل طريقة الدفع للعربية
   * @param {String} method طريقة الدفع
   * @returns {String} طريقة الدفع بالعربية
   */
  static getPaymentMethodInArabic(method) {
    const methodMap = {
      'cash': 'نقدي',
      'card': 'بطاقة ائتمان',
      'wallet': 'محفظة إلكترونية'
    };
    
    return methodMap[method] || method;
  }
}

module.exports = NotificationService;