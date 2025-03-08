import { store } from './store.js';

// تهيئة نظام الإشعارات
export function initNotifications() {
  // التحقق من دعم الإشعارات
  if (!('Notification' in window)) {
    console.log('هذا المتصفح لا يدعم إشعارات سطح المكتب');
    return;
  }
  
  // طلب الإذن بعرض الإشعارات
  requestNotificationPermission();
  
  // بدء الاستماع للإشعارات
  startListeningForNotifications();
}

// طلب إذن بعرض الإشعارات
async function requestNotificationPermission() {
  try {
    // التحقق من حالة الإذن
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('تم منح إذن الإشعارات');
      }
    }
  } catch (error) {
    console.error('خطأ في طلب إذن الإشعارات:', error);
  }
}

// بدء الاستماع للإشعارات
function startListeningForNotifications() {
  // في تطبيق حقيقي، يمكن استخدام WebSockets أو التحقق الدوري
  // سنقوم بالتحقق الدوري كمثال
  
  // التحقق من وجود إشعارات جديدة كل 30 ثانية
  setInterval(async () => {
    if (!store.getState().auth.isAuthenticated) {
      return;
    }
    
    try {
      const notifications = await fetchNotifications();
      
      // معالجة الإشعارات الجديدة
      notifications.forEach(notification => {
        // عرض الإشعار إذا لم يتم قراءته
        if (!notification.read) {
          showNotification(notification);
        }
      });
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    }
  }, 30000);
}

// جلب الإشعارات من الخادم
async function fetchNotifications() {
  try {
    const response = await fetch('/api/notifications', {
      headers: {
        'x-auth-token': store.getState().auth.token
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'فشل جلب الإشعارات');
    }
    
    // تحديث الإشعارات في المتجر
    store.updateState('ui.notifications', data.data);
    
    return data.data;
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    return [];
  }
}

// عرض الإشعار
function showNotification(notification) {
  // التحقق من إذن الإشعارات
  if (Notification.permission !== 'granted') {
    return;
  }
  
  // إنشاء إشعار
  const notificationOptions = {
    body: notification.message,
    icon: '/assets/icons/app-icon.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [100, 50, 100],
    badge: '/assets/icons/favicon.ico',
    tag: notification._id, // استخدام المعرف كوسم للتأكد من عدم التكرار
    data: {
      notificationId: notification._id,
      url: notification.action?.data || '/'
    }
  };
  
  // عرض الإشعار
  const notificationInstance = new Notification(notification.title, notificationOptions);
  
  // معالجة النقر على الإشعار
  notificationInstance.onclick = function() {
    // فتح التطبيق وتوجيه المستخدم إلى الصفحة المناسبة
    window.focus();
    window.location.href = this.data.url;
    
    // تحديث حالة قراءة الإشعار
    markNotificationAsRead(this.data.notificationId);
  };
  
  // تشغيل صوت الإشعار
  playNotificationSound();
}

// تحديث حالة قراءة الإشعار
async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'x-auth-token': store.getState().auth.token
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'فشل تحديث حالة قراءة الإشعار');
    }
    
    // تحديث الإشعارات في المتجر
    const notifications = store.getState().ui.notifications.map(notification => {
      if (notification._id === notificationId) {
        return { ...notification, read: true };
      }
      return notification;
    });
    
    store.updateState('ui.notifications', notifications);
  } catch (error) {
    console.error('خطأ في تحديث حالة قراءة الإشعار:', error);
  }
}

// تشغيل صوت الإشعار
function playNotificationSound() {
  const audio = new Audio('/assets/sounds/notification.mp3');
  audio.play().catch(error => {
    console.error('فشل تشغيل صوت الإشعار:', error);
  });
}

// إرسال إشعار من الواجهة
export async function sendNotification(title, message, type = 'system', data = {}) {
  try {
    // في تطبيق حقيقي، يمكن إرسال الإشعار إلى الخادم ليتم معالجته وإرساله للمستخدمين
    console.log('إرسال إشعار:', { title, message, type, data });
    
    // محاكاة عرض الإشعار للاختبار
    showLocalNotification(title, message, data);
    
    return true;
  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    return false;
  }
}

// عرض إشعار محلي
export function showLocalNotification(title, message, data = {}) {
  // إنشاء عنصر الإشعار
  const notification = document.createElement('div');
  notification.className = 'app-notification';
  notification.innerHTML = `
    <div class="notification-header">
      <h3>${title}</h3>
      <button class="close-btn">&times;</button>
    </div>
    <div class="notification-body">
      <p>${message}</p>
    </div>
  `;
  
  // إضافة الإشعار للصفحة
  document.body.appendChild(notification);
  
  // مؤقت لإظهار الإشعار
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // إغلاق الإشعار بعد 5 ثواني
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
  
  // معالجة النقر على زر الإغلاق
  notification.querySelector('.close-btn').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // تشغيل صوت الإشعار
  playNotificationSound();
}

// الحصول على عدد الإشعارات غير المقروءة
export function getUnreadNotificationsCount() {
  return store.getState().ui.notifications.filter(notification => !notification.read).length;
}

// تحديث شارة الإشعارات
export function updateNotificationBadge() {
  const count = getUnreadNotificationsCount();
  
  // تحديث شارة الإشعارات في شريط التنقل
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}