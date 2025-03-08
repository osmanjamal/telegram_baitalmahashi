/**
 * الحصول على الفرق بين تاريخين بالمللي ثانية
 * @param {Date} date1 التاريخ الأول
 * @param {Date} date2 التاريخ الثاني
 * @returns {Number} الفرق بالمللي ثانية
 */
const getDateDiffMs = (date1, date2) => {
    return Math.abs(new Date(date1) - new Date(date2));
  };
  
  /**
   * الحصول على الفرق بين تاريخين بالثواني
   * @param {Date} date1 التاريخ الأول
   * @param {Date} date2 التاريخ الثاني
   * @returns {Number} الفرق بالثواني
   */
  const getDateDiffSeconds = (date1, date2) => {
    return Math.abs(Math.floor(getDateDiffMs(date1, date2) / 1000));
  };
  
  /**
   * الحصول على الفرق بين تاريخين بالدقائق
   * @param {Date} date1 التاريخ الأول
   * @param {Date} date2 التاريخ الثاني
   * @returns {Number} الفرق بالدقائق
   */
  const getDateDiffMinutes = (date1, date2) => {
    return Math.abs(Math.floor(getDateDiffMs(date1, date2) / 60000));
  };
  
  /**
   * الحصول على الفرق بين تاريخين بالساعات
   * @param {Date} date1 التاريخ الأول
   * @param {Date} date2 التاريخ الثاني
   * @returns {Number} الفرق بالساعات
   */
  const getDateDiffHours = (date1, date2) => {
    return Math.abs(Math.floor(getDateDiffMs(date1, date2) / 3600000));
  };
  
  /**
   * الحصول على الفرق بين تاريخين بالأيام
   * @param {Date} date1 التاريخ الأول
   * @param {Date} date2 التاريخ الثاني
   * @returns {Number} الفرق بالأيام
   */
  const getDateDiffDays = (date1, date2) => {
    return Math.abs(Math.floor(getDateDiffMs(date1, date2) / 86400000));
  };
  
  /**
   * إضافة دقائق إلى تاريخ
   * @param {Date} date التاريخ
   * @param {Number} minutes عدد الدقائق
   * @returns {Date} التاريخ الجديد
   */
  const addMinutes = (date, minutes) => {
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  };
  
  /**
   * إضافة ساعات إلى تاريخ
   * @param {Date} date التاريخ
   * @param {Number} hours عدد الساعات
   * @returns {Date} التاريخ الجديد
   */
  const addHours = (date, hours) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  };
  
  /**
   * إضافة أيام إلى تاريخ
   * @param {Date} date التاريخ
   * @param {Number} days عدد الأيام
   * @returns {Date} التاريخ الجديد
   */
  const addDays = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };
  
  /**
   * التحقق من أن التاريخ في المستقبل
   * @param {Date} date التاريخ
   * @returns {Boolean} هل التاريخ في المستقبل
   */
  const isFutureDate = (date) => {
    return new Date(date) > new Date();
  };
  
  /**
   * التحقق من أن التاريخ في الماضي
   * @param {Date} date التاريخ
   * @returns {Boolean} هل التاريخ في الماضي
   */
  const isPastDate = (date) => {
    return new Date(date) < new Date();
  };
  
  /**
   * التحقق من أن التاريخ هو اليوم
   * @param {Date} date التاريخ
   * @returns {Boolean} هل التاريخ هو اليوم
   */
  const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };
  
  /**
   * الحصول على وقت العمل المتوقع (مثلاً لساعات العمل)
   * @param {Date} date التاريخ
   * @returns {Object} وقت العمل
   */
  const getBusinessHours = (date) => {
    const checkDate = new Date(date);
    const day = checkDate.getDay(); // 0 = الأحد، 6 = السبت
    
    // افتراض أن ساعات العمل من 9 صباحًا إلى 10 مساءً، كل يوم
    const businessHours = {
      open: new Date(checkDate).setHours(9, 0, 0, 0),
      close: new Date(checkDate).setHours(22, 0, 0, 0),
      isBusinessDay: true
    };
    
    return businessHours;
  };
  
  /**
   * تحويل أيام الأسبوع إلى العربية
   * @param {Number} day رقم اليوم (0-6)
   * @returns {String} اسم اليوم بالعربية
   */
  const dayOfWeekInArabic = (day) => {
    const days = [
      'الأحد',
      'الإثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت'
    ];
    
    return days[day];
  };
  
  module.exports = {
    getDateDiffMs,
    getDateDiffSeconds,
    getDateDiffMinutes,
    getDateDiffHours,
    getDateDiffDays,
    addMinutes,
    addHours,
    addDays,
    isFutureDate,
    isPastDate,
    isToday,
    getBusinessHours,
    dayOfWeekInArabic
  };