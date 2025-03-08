import { getCurrentLocation, initMap, addMarker, reverseGeocode, checkDeliveryRange } from '../../js/location.js';

export function renderLocationPicker(container, onLocationSelected, initialLocation = null) {
  // إعداد نموذج اختيار الموقع
  container.innerHTML = `
    <div class="location-picker">
      <div class="location-map-container">
        <div id="locationMap" class="location-map"></div>
        <div class="map-controls">
          <button type="button" class="btn btn-sm btn-primary" id="getCurrentLocationBtn">
            <i class="icon-location"></i> استخدام موقعي الحالي
          </button>
        </div>
      </div>
      
      <div class="location-form">
        <div class="form-group">
          <label for="locationSearchInput">البحث عن موقع</label>
          <div class="search-input-group">
            <input type="text" id="locationSearchInput" class="form-control" placeholder="أدخل العنوان للبحث...">
            <button type="button" class="btn btn-primary" id="searchLocationBtn">
              <i class="icon-search"></i>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label for="addressInput">العنوان بالتفصيل</label>
          <textarea id="addressInput" class="form-control" rows="2" placeholder="مثال: شارع الملك فهد، حي الورود"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="buildingNumberInput">رقم المبنى</label>
            <input type="text" id="buildingNumberInput" class="form-control" placeholder="مثال: 123">
          </div>
          
          <div class="form-group">
            <label for="floorNumberInput">الطابق</label>
            <input type="text" id="floorNumberInput" class="form-control" placeholder="مثال: 3">
          </div>
        </div>
        
        <div class="form-group">
          <label for="apartmentNumberInput">رقم الشقة</label>
          <input type="text" id="apartmentNumberInput" class="form-control" placeholder="مثال: 12">
        </div>
        
        <div class="form-group">
          <label for="landmarkInput">علامة مميزة</label>
          <input type="text" id="landmarkInput" class="form-control" placeholder="مثال: بجوار مسجد الحي">
        </div>
        
        <div class="location-status" id="locationStatus"></div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary btn-block" id="confirmLocationBtn" disabled>
            تأكيد الموقع
          </button>
        </div>
      </div>
    </div>
  `;
  
  // الإحداثيات الأولية (مركز الرياض كمثال)
  const defaultLocation = { lat: 24.7136, lng: 46.6753 };
  let selectedLocation = initialLocation || defaultLocation;
  
  // تهيئة الخريطة
  let map, marker;
  
  // عند تحميل مكتبة Leaflet
  if (typeof L !== 'undefined') {
    // إنشاء الخريطة
    map = initMap('locationMap', selectedLocation);
    
    // إضافة علامة موقع افتراضية
    marker = addMarker(map, selectedLocation, { draggable: true });
    
    // معالجة سحب العلامة
    marker.on('dragend', async function(e) {
      const position = e.target.getLatLng();
      selectedLocation = { lat: position.lat, lng: position.lng };
      
      // تحديث معلومات الموقع
      await updateLocationInfo(selectedLocation);
    });
    
    // معالجة النقر على الخريطة
    map.on('click', async function(e) {
      selectedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      // تحديث موقع العلامة
      marker.setLatLng(e.latlng);
      
      // تحديث معلومات الموقع
      await updateLocationInfo(selectedLocation);
    });
  } else {
    // إذا لم تكن المكتبة متاحة
    document.getElementById('locationMap').innerHTML = `
      <div class="map-placeholder">
        <p>لم يتم تحميل مكتبة الخرائط</p>
      </div>
    `;
  }
  
  // معالجة النقر على زر الموقع الحالي
  const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
  getCurrentLocationBtn.addEventListener('click', async () => {
    try {
      // إظهار مؤشر التحميل
      getCurrentLocationBtn.disabled = true;
      getCurrentLocationBtn.innerHTML = '<i class="icon-spinner"></i> جاري التحديد...';
      
      // الحصول على الموقع الحالي
      const position = await getCurrentLocation();
      selectedLocation = position;
      
      // تحديث موقع العلامة والخريطة
      if (map && marker) {
        marker.setLatLng([position.lat, position.lng]);
        map.setView([position.lat, position.lng], 15);
      }
      
      // تحديث معلومات الموقع
      await updateLocationInfo(selectedLocation);
    } catch (error) {
      console.error('خطأ في الحصول على الموقع الحالي:', error);
      document.getElementById('locationStatus').innerHTML = `
        <div class="alert alert-error">
          <p>${error.message}</p>
        </div>
      `;
    } finally {
      // إعادة تفعيل الزر
      getCurrentLocationBtn.disabled = false;
      getCurrentLocationBtn.innerHTML = '<i class="icon-location"></i> استخدام موقعي الحالي';
    }
  });
  
  // معالجة البحث عن موقع
  const searchLocationBtn = document.getElementById('searchLocationBtn');
  const locationSearchInput = document.getElementById('locationSearchInput');
  
  searchLocationBtn.addEventListener('click', async () => {
    const searchText = locationSearchInput.value.trim();
    
    if (!searchText) {
      return;
    }
    
    try {
      // إظهار مؤشر التحميل
      searchLocationBtn.disabled = true;
      searchLocationBtn.innerHTML = '<i class="icon-spinner"></i>';
      
      // البحث عن الموقع (في تطبيق حقيقي، استخدم خدمة geocoding)
      // هنا نستخدم محاكاة بسيطة
      const mockPosition = { lat: 24.7136, lng: 46.6753 };
      selectedLocation = mockPosition;
      
      // تحديث موقع العلامة والخريطة
      if (map && marker) {
        marker.setLatLng([mockPosition.lat, mockPosition.lng]);
        map.setView([mockPosition.lat, mockPosition.lng], 15);
      }
      
      // تحديث معلومات الموقع
      await updateLocationInfo(selectedLocation);
    } catch (error) {
      console.error('خطأ في البحث عن الموقع:', error);
      document.getElementById('locationStatus').innerHTML = `
        <div class="alert alert-error">
          <p>حدث خطأ أثناء البحث عن الموقع</p>
        </div>
      `;
    } finally {
      // إعادة تفعيل الزر
      searchLocationBtn.disabled = false;
      searchLocationBtn.innerHTML = '<i class="icon-search"></i>';
    }
  });
  
  // معالجة ضغط Enter في حقل البحث
  locationSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchLocationBtn.click();
    }
  });
  
  // معالجة تأكيد الموقع
  const confirmLocationBtn = document.getElementById('confirmLocationBtn');
  
  confirmLocationBtn.addEventListener('click', () => {
    // جمع البيانات
    const address = document.getElementById('addressInput').value;
    const buildingNumber = document.getElementById('buildingNumberInput').value;
    const floorNumber = document.getElementById('floorNumberInput').value;
    const apartmentNumber = document.getElementById('apartmentNumberInput').value;
    const landmark = document.getElementById('landmarkInput').value;
    
    // إنشاء كائن بيانات الموقع
    const locationData = {
      coordinates: selectedLocation,
      address,
      buildingNumber,
      floorNumber,
      apartmentNumber,
      landmark
    };
    
    // استدعاء الدالة المعالجة
    if (onLocationSelected) {
      onLocationSelected(locationData);
    }
  });
  
  // تحديث معلومات الموقع
  async function updateLocationInfo(location) {
    try {
      // التحقق من نطاق التوصيل
      const deliveryCheck = await checkDeliveryRange(location);
      
      // تحويل الإحداثيات إلى عنوان
      const addressInfo = await reverseGeocode(location.lat, location.lng);
      
      // تحديث حقل العنوان
      document.getElementById('addressInput').value = addressInfo.address || '';
      
      // تحديث حالة الموقع
      const locationStatus = document.getElementById('locationStatus');
      
      if (deliveryCheck.isWithinRange) {
        locationStatus.innerHTML = `
          <div class="alert alert-success">
            <p>الموقع ضمن نطاق التوصيل ✓</p>
            <p>المسافة: ${deliveryCheck.distance.toFixed(1)} كم</p>
            <p>رسوم التوصيل: ${formatCurrency(deliveryCheck.deliveryFee)}</p>
          </div>
        `;
        
        // تفعيل زر التأكيد
        confirmLocationBtn.disabled = false;
      } else {
        locationStatus.innerHTML = `
          <div class="alert alert-error">
            <p>الموقع خارج نطاق التوصيل ✗</p>
            <p>المسافة: ${deliveryCheck.distance.toFixed(1)} كم</p>
            <p>الحد الأقصى للتوصيل: ${deliveryCheck.maxDistance} كم</p>
          </div>
        `;
        
        // تعطيل زر التأكيد
        confirmLocationBtn.disabled = true;
      }
    } catch (error) {
      console.error('خطأ في تحديث معلومات الموقع:', error);
      document.getElementById('locationStatus').innerHTML = `
        <div class="alert alert-error">
          <p>حدث خطأ أثناء التحقق من الموقع</p>
        </div>
      `;
    }
  }
  
  // إذا كان هناك موقع مبدئي، قم بتحديث المعلومات
  if (initialLocation) {
    updateLocationInfo(initialLocation);
  }
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}