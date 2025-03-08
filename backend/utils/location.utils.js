/**
 * حساب المسافة بين نقطتين باستخدام صيغة هافرساين
 * @param {Number} lat1 خط العرض للنقطة الأولى
 * @param {Number} lon1 خط الطول للنقطة الأولى
 * @param {Number} lat2 خط العرض للنقطة الثانية
 * @param {Number} lon2 خط الطول للنقطة الثانية
 * @returns {Number} المسافة بالكيلومتر
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };
  
  /**
   * تحويل الدرجات إلى راديان
   * @param {Number} deg الزاوية بالدرجات
   * @returns {Number} الزاوية بالراديان
   */
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  
  /**
   * تحويل الراديان إلى درجات
   * @param {Number} rad الزاوية بالراديان
   * @returns {Number} الزاوية بالدرجات
   */
  const rad2deg = (rad) => {
    return rad * (180 / Math.PI);
  };
  
  /**
   * التحقق من صحة الإحداثيات
   * @param {Object} coordinates الإحداثيات
   * @returns {Boolean} صحة الإحداثيات
   */
  const isValidCoordinates = (coordinates) => {
    // التحقق من وجود خط العرض وخط الطول
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return false;
    }
    
    // التحقق من أن خط العرض بين -90 و 90
    if (coordinates.lat < -90 || coordinates.lat > 90) {
      return false;
    }
    
    // التحقق من أن خط الطول بين -180 و 180
    if (coordinates.lng < -180 || coordinates.lng > 180) {
      return false;
    }
    
    return true;
  };
  
  /**
   * الحصول على نقطة على مسافة معينة وزاوية من نقطة أخرى
   * @param {Number} lat خط العرض للنقطة
   * @param {Number} lng خط الطول للنقطة
   * @param {Number} distance المسافة بالكيلومتر
   * @param {Number} bearing الزاوية بالدرجات
   * @returns {Object} الإحداثيات الجديدة
   */
  const getDestinationPoint = (lat, lng, distance, bearing) => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const brng = deg2rad(bearing);
    const lat1 = deg2rad(lat);
    const lon1 = deg2rad(lng);
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
    );
    
    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return {
      lat: rad2deg(lat2),
      lng: rad2deg(lon2)
    };
  };
  
  /**
   * الحصول على المنطقة المحيطة بنقطة معينة
   * @param {Number} lat خط العرض للنقطة
   * @param {Number} lng خط الطول للنقطة
   * @param {Number} radius نصف القطر بالكيلومتر
   * @returns {Object} حدود المنطقة
   */
  const getBoundingBox = (lat, lng, radius) => {
    // الحصول على النقاط الأربع للمنطقة المحيطة
    const north = getDestinationPoint(lat, lng, radius, 0);
    const east = getDestinationPoint(lat, lng, radius, 90);
    const south = getDestinationPoint(lat, lng, radius, 180);
    const west = getDestinationPoint(lat, lng, radius, 270);
    
    return {
      north: north.lat,
      east: east.lng,
      south: south.lat,
      west: west.lng
    };
  };
  
  /**
   * تقدير وقت التوصيل
   * @param {Number} distance المسافة بالكيلومتر
   * @returns {Number} وقت التوصيل بالدقائق
   */
  const estimateDeliveryTime = (distance) => {
    // معدل سرعة تقريبي (2 دقيقة لكل كيلومتر + 10 دقائق ثابتة)
    return Math.ceil(distance * 2) + 10;
  };
  
  module.exports = {
    calculateDistance,
    deg2rad,
    rad2deg,
    isValidCoordinates,
    getDestinationPoint,
    getBoundingBox,
    estimateDeliveryTime
  };