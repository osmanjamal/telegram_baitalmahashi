const fs = require('fs');
const path = require('path');

// إنشاء مسار ملف السجل
const createLogDirectoryIfNotExists = () => {
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};

// وسيط تسجيل السجلات
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // معالجة استجابة الطلب
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logDir = createLogDirectoryIfNotExists();
    const today = new Date().toISOString().split('T')[0];
    const logFilePath = path.join(logDir, `${today}.log`);
    
    // تنسيق السجل
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      userId: req.user ? req.user.id : 'غير مسجل دخول'
    };
    
    // كتابة السجل في الملف
    fs.appendFile(
      logFilePath,
      JSON.stringify(log) + '\n',
      err => {
        if (err) {
          console.error('خطأ في كتابة السجل:', err);
        }
      }
    );
    
    // إذا كان الرد خطأ، سجل المزيد من المعلومات
    if (res.statusCode >= 400) {
      console.error(`[${log.timestamp}] ${log.method} ${log.url} ${log.status} ${log.duration}`);
    }
  });
  
  next();
};

module.exports = loggerMiddleware;