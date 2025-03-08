const axios = require('axios');

class LocationService {
  /**
   * التحقق مما إذا كان الموقع ضمن نطاق التوصيل
   * @param {Object} coordinates إحداثيات الموقع
   * @returns {Promise<Object>} نتيجة التحقق من نطاق التوصيل
   */
  static async checkDeliveryRange(coordinates) {
    try {
      // إحداثيات المطعم
      const restaurantLocation = {
        lat: 24.774265, // مثال: إحداثيات المطعم
        lng: 46.738586
      };
      
      // حساب المسافة بين المطعم والموقع المحدد
      const distance = await this.calculateDistance(
        restaurantLocation.lat,
        restaurantLocation.lng,
        coordinates.lat,
        coordinates.lng
      );
      
      // التحقق من المسافة (مثلاً: الحد الأقصى 10 كم)
      const maxDistance = process.env.MAX_DELIVERY_DISTANCE || 10;
      const isWithinRange = distance <= maxDistance;
      
      // حساب رسوم التوصيل بناءً على المسافة
      let deliveryFee = 0;
      
      if (isWithinRange) {
        if (distance <= 3) {
          deliveryFee = 10; // 10 ريال للمسافات حتى 3 كم
        } else if (distance <= 7) {
          deliveryFee = 15; // 15 ريال للمسافات بين 3 و 7 كم
        } else {
          deliveryFee = 25; // 25 ريال للمسافات بين 7 و 10 كم
        }
      }
      
      return {
        isWithinRange,
        distance: parseFloat(distance.toFixed(2)),
        deliveryFee,
        maxDistance: parseFloat(maxDistance),
        unit: 'كم'
      };
    } catch (error) {
      console.error('خطأ في التحقق من نطاق التوصيل:', error);
      throw error;
    }
  }
  
  /**
   * حساب المسافة بين نقطتين باستخدام صيغة هافرساين
   * @param {Number} lat1 خط العرض للنقطة الأولى
   * @param {Number} lon1 خط الطول للنقطة الأولى
   * @param {Number} lat2 خط العرض للنقطة الثانية
   * @param {Number} lon2 خط الطول للنقطة الثانية
   * @returns {Number} المسافة بالكيلومتر
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // المسافة بالكيلومتر
    
    return distance;
  }
  
  /**
   * تحويل الدرجات إلى راديان
   * @param {Number} deg الزاوية بالدرجات
   * @returns {Number} الزاوية بالراديان
   */
  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  
  /**
   * تحويل الإحداثيات إلى عنوان
   * @param {Object} coordinates إحداثيات الموقع
   * @returns {Promise<Object>} العنوان
   */
  static async reverseGeocode(coordinates) {
    try {
      // استخدام خدمة مثل Google Maps Geocoding API
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error('مفتاح API لخرائط Google غير موجود');
      }
      
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${coordinates.lat},${coordinates.lng}`,
            key: apiKey,
            language: 'ar'
          }
        }
      );
      
      if (response.data.status !== 'OK') {
        throw new Error(`خطأ في التحويل العكسي للإحداثيات: ${response.data.status}`);
      }
      
      // استخراج العنوان
      const result = response.data.results[0];
      
      return {
        address: result.formatted_address,
        components: result.address_components,
        placeId: result.place_id
      };
    } catch (error) {
      console.error('خطأ في تحويل الإحداثيات إلى عنوان:', error);
      
      // استرجاع تنسيق بسيط في حالة الخطأ
      return {
        address: `${coordinates.lat}, ${coordinates.lng}`,
        components: [],
        placeId: null
      };
    }
  }
  
  /**
   * تحويل العنوان إلى إحداثيات
   * @param {String} address العنوان
   * @returns {Promise<Object>} الإحداثيات
   */
  static async geocode(address) {
    try {
      // استخدام خدمة مثل Google Maps Geocoding API
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error('مفتاح API لخرائط Google غير موجود');
      }
      
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address,
            key: apiKey,
            language: 'ar'
          }
        }
      );
      
      if (response.data.status !== 'OK') {
        throw new Error(`خطأ في تحويل العنوان إلى إحداثيات: ${response.data.status}`);
      }
      
      // استخراج الإحداثيات
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id
      };
    } catch (error) {
      console.error('خطأ في تحويل العنوان إلى إحداثيات:', error);
      throw error;
    }
  }
  
  /**
   * تقدير وقت التوصيل
   * @param {Object} orderLocation إحداثيات موقع الطلب
   * @returns {Promise<Number>} وقت التوصيل المقدر بالدقائق
   */
  static async estimateDeliveryTime(orderLocation) {
    try {
      // إحداثيات المطعم
      const restaurantLocation = {
        lat: 24.774265, // مثال: إحداثيات المطعم
        lng: 46.738586
      };
      
      // حساب المسافة
      const distance = await this.calculateDistance(
        restaurantLocation.lat,
        restaurantLocation.lng,
        orderLocation.lat,
        orderLocation.lng
      );
      
      // تقدير وقت القيادة (في المتوسط 2 دقيقة لكل كيلومتر + 10 دقائق ثابتة)
      const drivingTime = Math.ceil(distance * 2) + 10;
      
      return drivingTime;
    } catch (error) {
      console.error('خطأ في تقدير وقت التوصيل:', error);
      return 30; // وقت افتراضي في حالة الخطأ
    }
  }
}

module.exports = LocationService;