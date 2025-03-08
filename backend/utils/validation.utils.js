/**
 * التحقق من صحة البريد الإلكتروني
 * @param {String} email البريد الإلكتروني
 * @returns {Boolean} صحة البريد الإلكتروني
 */
const isValidEmail = (email) => {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(String(email).toLowerCase());
  };
  
  /**
   * التحقق من صحة رقم الهاتف السعودي
   * @param {String} phone رقم الهاتف
   * @returns {Boolean} صحة رقم الهاتف
   */
  const isValidSaudiPhone = (phone) => {
    // تنظيف رقم الهاتف من أي أحرف غير رقمية
    const cleaned = ('' + phone).replace(/\D/g, '');
    
    // التحقق من أن الرقم يبدأ بـ 05 ويحتوي على 10 أرقام
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
      return true;
    }
    
    // التحقق من أن الرقم يبدأ بـ 966 ويحتوي على 12 رقم
    if (cleaned.length === 12 && cleaned.startsWith('966')) {
      return true;
    }
    
    return false;
  };
  
  /**
   * التحقق من صحة كلمة المرور
   * @param {String} password كلمة المرور
   * @returns {Object} صحة كلمة المرور وقوتها
   */
  const validatePassword = (password) => {
    // التحقق من الطول
    const isLengthValid = password.length >= 8;
    
    // التحقق من وجود حرف كبير
    const hasUppercase = /[A-Z]/.test(password);
    
    // التحقق من وجود حرف صغير
    const hasLowercase = /[a-z]/.test(password);
    
    // التحقق من وجود رقم
    const hasNumber = /[0-9]/.test(password);
    
    // التحقق من وجود حرف خاص
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // حساب قوة كلمة المرور
    let strength = 0;
    if (isLengthValid) strength++;
    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;
    
    return {
      isValid: isLengthValid && (hasUppercase || hasLowercase) && hasNumber,
      strength, // 0-5
      issues: {
        length: !isLengthValid,
        uppercase: !hasUppercase,
        lowercase: !hasLowercase,
        number: !hasNumber,
        specialChar: !hasSpecialChar
      }
    };
  };
  
  /**
   * التحقق من صحة معرف MongoDB
   * @param {String} id المعرف
   * @returns {Boolean} صحة المعرف
   */
  const isValidMongoId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
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
   * التحقق من صحة التاريخ
   * @param {String} dateStr التاريخ
   * @returns {Boolean} صحة التاريخ
   */
  const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  };
  
  /**
   * التحقق من أن التاريخ في المستقبل
   * @param {String} dateStr التاريخ
   * @returns {Boolean} هل التاريخ في المستقبل
   */
  const isFutureDate = (dateStr) => {
    if (!isValidDate(dateStr)) {
      return false;
    }
    
    const date = new Date(dateStr);
    return date > new Date();
  };
  
  module.exports = {
    isValidEmail,
    isValidSaudiPhone,
    validatePassword,
    isValidMongoId,
    isValidCoordinates,
    isValidDate,
    isFutureDate
  };