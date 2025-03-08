const fs = require('fs');
const path = require('path');

// إنشاء مسار ملف السجل
const createLogDirectoryIfNotExists = () => {
  const logDir = path.join(__dirname, '../../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};

/**
 * كتابة سجل في ملف
 * @param {String} level مستوى السجل
 * @param {String} message الرسالة
 * @param {Object} meta بيانات إضافية
 */
const logToFile = (level, message, meta = {}) => {
  const logDir = createLogDirectoryIfNotExists();
  const today = new Date().toISOString().split('T')[0];
  const logFilePath = path.join(logDir, `${today}.log`);
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  fs.appendFile(
    logFilePath,
    JSON.stringify(logEntry) + '\n',
    err => {
      if (err) {
        console.error('خطأ في كتابة السجل:', err);
      }
    }
  );
};

/**
 * كتابة سجل خطأ
 * @param {String} message رسالة الخطأ
 * @param {Object} meta بيانات إضافية
 */
const error = (message, meta = {}) => {
  console.error(`ERROR: ${message}`, meta);
  logToFile('error', message, meta);
};

/**
 * كتابة سجل تحذير
 * @param {String} message رسالة التحذير
 * @param {Object} meta بيانات إضافية
 */
const warn = (message, meta = {}) => {
  console.warn(`WARN: ${message}`, meta);
  logToFile('warn', message, meta);
};

/**
 * كتابة سجل معلومات
 * @param {String} message رسالة المعلومات
 * @param {Object} meta بيانات إضافية
 */
const info = (message, meta = {}) => {
  console.info(`INFO: ${message}`, meta);
  logToFile('info', message, meta);
};

/**
 * كتابة سجل تصحيح
 * @param {String} message رسالة التصحيح
 * @param {Object} meta بيانات إضافية
 */
const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`DEBUG: ${message}`, meta);
    logToFile('debug', message, meta);
  }
};

/**
 * كتابة سجل طلب HTTP
 * @param {Object} req طلب HTTP
 * @param {Object} res استجابة HTTP
 * @param {Number} duration مدة الطلب بالمللي ثانية
 */
const logHttpRequest = (req, res, duration) => {
  const log = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user.id : 'غير مسجل دخول'
  };
  
  logToFile('http', 'HTTP Request', log);
};

module.exports = {
  error,
  warn,
  info,
  debug,
  logHttpRequest
};