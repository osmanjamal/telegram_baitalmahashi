// اسم التخزين المؤقت
const CACHE_NAME = 'bayt-almahashy-cache-v1';

// الملفات التي سيتم تخزينها مؤقتًا
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/themes.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/router.js',
  '/js/store.js',
  '/js/api.js',
  '/js/location.js',
  '/js/payments.js',
  '/js/notifications.js',
  '/assets/fonts/cairo-regular.ttf',
  '/assets/fonts/cairo-bold.ttf',
  '/assets/images/logo/logo-full.png',
  '/assets/images/logo/logo-icon.png',
  '/assets/icons/app-icon.png',
  '/assets/icons/favicon.ico',
  '/manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: تم التثبيت');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: تخزين الملفات مؤقتًا');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تنشيط Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: تم التنشيط');
  
  // إزالة التخزين المؤقت القديم
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: حذف التخزين المؤقت القديم', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض طلبات الشبكة
self.addEventListener('fetch', event => {
  // تجاهل طلبات API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // استخدام الملف المخزن مؤقتًا إذا كان موجودًا
        if (response) {
          return response;
        }
        
        // طلب الملف من الشبكة
        return fetch(event.request)
          .then(response => {
            // التأكد من صحة الاستجابة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // نسخة من الاستجابة للتخزين المؤقت
            const responseToCache = response.clone();
            
            // تخزين الاستجابة مؤقتًا
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('Service Worker: خطأ في الشبكة', error);
            
            // إرجاع صفحة الخطأ للمسارات غير API
            if (event.request.url.includes('/api/')) {
              return new Response(JSON.stringify({
                success: false,
                message: 'أنت غير متصل بالإنترنت'
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // محاولة إرجاع صفحة الخطأ المخزنة مؤقتًا
            return caches.match('/offline.html');
          });
      })
  );
});

// استقبال الإشعارات
self.addEventListener('push', event => {
  console.log('Service Worker: تم استلام إشعار', event.data.text());
  
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/assets/icons/app-icon.png',
    badge: '/assets/icons/favicon.ico',
    dir: 'rtl',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// التفاعل مع الإشعارات
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: تم النقر على الإشعار', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});