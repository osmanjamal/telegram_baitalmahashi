const mongoose = require('mongoose');
const logger = require('../backend/utils/logger.utils');

// إعدادات اتصال قاعدة البيانات MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info(`🍃 MongoDB Connected: ${conn.connection.host}`);
    
    // إعداد الفهارس والتحققات
    setupDatabaseHandlers();
    
    return conn;
  } catch (error) {
    logger.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// إعداد معالجات قاعدة البيانات
const setupDatabaseHandlers = () => {
  // معالجة أحداث اتصال قاعدة البيانات
  mongoose.connection.on('disconnected', () => {
    logger.warn('❌ MongoDB disconnected');
  });
  
  mongoose.connection.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected');
  });
  
  // معالجة إيقاف العملية
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('👋 MongoDB connection closed due to app termination');
      process.exit(0);
    } catch (error) {
      logger.error(`❌ Error closing MongoDB connection: ${error.message}`);
      process.exit(1);
    }
  });
};

module.exports = connectDB;