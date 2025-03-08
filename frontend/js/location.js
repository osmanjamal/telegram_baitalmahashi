// دالة للحصول على الموقع الحالي
export async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      // التحقق من دعم خدمة تحديد الموقع
      if (!navigator.geolocation) {
        reject(new Error('خدمة تحديد الموقع غير مدعومة في متصفحك'));
        return;
      }
      
      // الحصول على الموقع
      navigator.geolocation.getCurrentPosition(
        // نجاح
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        // فشل
        error => {
          let errorMessage = 'حدث خطأ أثناء تحديد الموقع';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض الوصول إلى الموقع. يرجى السماح للتطبيق بالوصول إلى موقعك.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'معلومات الموقع غير متاحة حاليًا.';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة طلب الموقع.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        // الخيارات
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
  
  // دالة لحساب المسافة بين موقعين
  export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // المسافة بالكيلومتر
    
    return distance;
  }
  
  // دالة لتحويل الدرجات إلى راديان
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  
  // دالة لإنشاء خريطة
  export function initMap(containerId, center, zoom = 13) {
    // استخدام Leaflet إذا كان متاحًا
    if (typeof L !== 'undefined') {
      const map = L.map(containerId).setView([center.lat, center.lng], zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      return map;
    } else {
      console.error('مكتبة Leaflet غير متاحة');
      return null;
    }
  }
  
  // دالة لإضافة علامة على الخريطة
  export function addMarker(map, position, options = {}) {
    if (!map) return null;
    
    return L.marker([position.lat, position.lng], options).addTo(map);
  }
  
  // دالة لتحويل العنوان إلى إحداثيات
  export async function geocodeAddress(address) {
    try {
      const response = await fetch(`/api/location/geocode?address=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'فشل تحويل العنوان إلى إحداثيات');
      }
      
      return data.data;
    } catch (error) {
      console.error('خطأ في تحويل العنوان إلى إحداثيات:', error);
      throw error;
    }
  }
  
  // دالة لتحويل الإحداثيات إلى عنوان
  export async function reverseGeocode(lat, lng) {
    try {
      const response = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'فشل تحويل الإحداثيات إلى عنوان');
      }
      
      return data.data;
    } catch (error) {
      console.error('خطأ في تحويل الإحداثيات إلى عنوان:', error);
      throw error;
    }
  }
  
  // دالة للتحقق من نطاق التوصيل
  export async function checkDeliveryRange(coordinates) {
    try {
      const response = await fetch('/api/location/check-delivery-range', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coordinates })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'فشل التحقق من نطاق التوصيل');
      }
      
      return data.data;
    } catch (error) {
      console.error('خطأ في التحقق من نطاق التوصيل:', error);
      throw error;
    }
  }
  
  // دالة لتقدير وقت التوصيل
  export function estimateDeliveryTime(distance) {
    // 2 دقيقة لكل كيلومتر + 10 دقائق ثابتة للتجهيز
    return Math.ceil(distance * 2) + 10;
  }
  
  // دالة لتنسيق المسافة
  export function formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} متر`;
    }
    
    return `${distance.toFixed(1)} كم`;
  }