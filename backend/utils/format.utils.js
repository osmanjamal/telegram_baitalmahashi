/**
 * تنسيق المبلغ كعملة
 * @param {Number} amount المبلغ
 * @param {String} currency العملة
 * @returns {String} المبلغ المنسق
 */
const formatCurrency = (amount, currency = 'SAR') => {
    // تحديد التنسيق حسب العملة
    const formatter = new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount);
  };
  
  /**
   * تنسيق التاريخ
   * @param {Date} date التاريخ
   * @param {String} locale اللغة
   * @returns {String} التاريخ المنسق
   */
  const formatDate = (date, locale = 'ar-SA') => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  /**
   * تنسيق الوقت
   * @param {Date} date التاريخ والوقت
   * @param {String} locale اللغة
   * @returns {String} الوقت المنسق
   */
  const formatTime = (date, locale = 'ar-SA') => {
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * تنسيق التاريخ والوقت
   * @param {Date} date التاريخ والوقت
   * @param {String} locale اللغة
   * @returns {String} التاريخ والوقت المنسق
   */
  const formatDateTime = (date, locale = 'ar-SA') => {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * تنسيق الوقت النسبي
   * @param {Date} date التاريخ
   * @returns {String} الوقت النسبي
   */
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    // تحويل الفرق إلى ثواني
    const seconds = Math.floor(diff / 1000);
    
    // تنسيق الوقت النسبي
    if (seconds < 60) {
      return 'منذ لحظات';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    } else if (seconds < 2592000) {
      const weeks = Math.floor(seconds / 604800);
      return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
    } else if (seconds < 31536000) {
      const months = Math.floor(seconds / 2592000);
      return `منذ ${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
    } else {
      const years = Math.floor(seconds / 31536000);
      return `منذ ${years} ${years === 1 ? 'سنة' : 'سنوات'}`;
    }
  };
  
  /**
   * تنسيق رقم الهاتف
   * @param {String} phone رقم الهاتف
   * @returns {String} رقم الهاتف المنسق
   */
  const formatPhoneNumber = (phone) => {
    // تنظيف رقم الهاتف من أي أحرف غير رقمية
    const cleaned = ('' + phone).replace(/\D/g, '');
    
    // التحقق من أن الرقم يبدأ بـ 05 ويحتوي على 10 أرقام
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    }
    
    // التحقق من أن الرقم يبدأ بـ 966 ويحتوي على 12 رقم
    if (cleaned.length === 12 && cleaned.startsWith('966')) {
      return `+${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    }
    
    // إذا لم يطابق أي تنسيق، إرجاع الرقم كما هو
    return phone;
  };
  
  /**
   * تنسيق نص للعرض المختصر
   * @param {String} text النص
   * @param {Number} maxLength الطول الأقصى
   * @returns {String} النص المختصر
   */
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.slice(0, maxLength) + '...';
  };
  
  /**
   * تنسيق النص للعرض في العنوان
   * @param {String} text النص
   * @returns {String} النص المنسق
   */
  const slugify = (text) => {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };
  
  module.exports = {
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    formatPhoneNumber,
    truncateText,
    slugify
  };