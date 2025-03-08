// استيراد المكونات اللازمة
import { router } from './router.js';
import { store } from './store.js';
import { initNotifications } from './notifications.js';
import { checkAuthStatus } from './api.js';

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async () => {
  console.log('تطبيق بيت المحاشي - بدء التشغيل');
  
  // تهيئة المتجر
  await store.init();
  
  // التحقق من حالة المصادقة
  await checkAuthStatus();
  
  // تهيئة التوجيه
  router.init();
  
  // تهيئة الإشعارات
  initNotifications();
  
  // تهيئة تبديل السمات
  setupThemeSwitch();
  
  // تهيئة فحص الاتصال بالإنترنت
  setupOfflineDetection();
  
  // إخفاء شاشة البداية
  hideSplashScreen();
});

// إخفاء شاشة البداية
function hideSplashScreen() {
  // تأخير قصير لإظهار الشاشة
  setTimeout(() => {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      splashScreen.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }
  }, 1000);
}

// تهيئة تبديل السمات
function setupThemeSwitch() {
  // تحميل السمة المفضلة من التخزين المحلي
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // إنشاء زر تبديل السمات
  const themeSwitch = document.createElement('div');
  themeSwitch.className = 'theme-switch';
  themeSwitch.innerHTML = '<i class="icon-palette"></i>';
  document.body.appendChild(themeSwitch);
  
  // إنشاء قائمة خيارات السمات
  const themeOptions = document.createElement('div');
  themeOptions.className = 'theme-options';
  themeOptions.innerHTML = `
    <div class="theme-option ${savedTheme === 'light' ? 'active' : ''}" data-theme="light">
      <i class="icon-sun"></i> نمط النهار
    </div>
    <div class="theme-option ${savedTheme === 'dark' ? 'active' : ''}" data-theme="dark">
      <i class="icon-moon"></i> نمط الليل
    </div>
  `;
  document.body.appendChild(themeOptions);
  
  // معالجة النقر على زر تبديل السمات
  themeSwitch.addEventListener('click', () => {
    themeOptions.classList.toggle('active');
  });
  
  // معالجة اختيار السمة
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // تحديث حالة النشط
      document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
      });
      option.classList.add('active');
      
      // إغلاق القائمة
      themeOptions.classList.remove('active');
    });
  });
  
  // إغلاق قائمة السمات عند النقر خارجها
  document.addEventListener('click', (event) => {
    if (!themeSwitch.contains(event.target) && !themeOptions.contains(event.target)) {
      themeOptions.classList.remove('active');
    }
  });
}

// تهيئة فحص الاتصال بالإنترنت
function setupOfflineDetection() {
  const offlineAlert = document.getElementById('offlineAlert');
  const retryButton = document.getElementById('retryConnection');
  
  // التحقق من حالة الاتصال
  function updateOnlineStatus() {
    if (navigator.onLine) {
      offlineAlert.style.display = 'none';
    } else {
      offlineAlert.style.display = 'flex';
    }
  }
  
  // معالجة تغيير حالة الاتصال
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // معالجة النقر على زر إعادة المحاولة
  retryButton.addEventListener('click', () => {
    updateOnlineStatus();
  });
  
  // التحقق من حالة الاتصال الأولية
  updateOnlineStatus();
}

// تصدير الدالة لإعادة تحميل الصفحة
export function reloadApp() {
  window.location.reload();
}

// تصدير الدالة لتحديث عدد العناصر في السلة
export function updateCartBadge() {
  const cartBadge = document.getElementById('cartBadge');
  const cartCount = store.getCartItemsCount();
  
  if (cartBadge) {
    cartBadge.textContent = cartCount;
    
    if (cartCount > 0) {
      cartBadge.style.display = 'flex';
    } else {
      cartBadge.style.display = 'none';
    }
  }
}

// تسجيل الخدمة العاملة إذا كانت متاحة
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('تم تسجيل Service Worker: ', registration.scope);
      })
      .catch(error => {
        console.error('فشل تسجيل Service Worker: ', error);
      });
  });
}