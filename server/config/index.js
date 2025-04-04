/**
 * 后端配置文件
 * 基于环境变量实现，确保在应用启动前加载.env文件
 */

// 加载环境变量
require('dotenv').config();

const config = {
  // 应用信息
  app: {
    name: process.env.APP_NAME || '团队报名平台',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost'
  },
  
  // 数据库配置
  database: {
    uri: process.env.DB_URI || 'mongodb://localhost:27017/team_registration',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // 支付配置
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'wechat',
    appId: process.env.PAYMENT_APP_ID,
    mchId: process.env.PAYMENT_MCH_ID,
    serialNumber: process.env.PAYMENT_SERIAL_NUMBER,
    notifyUrl: process.env.PAYMENT_NOTIFY_URL,
    mock: process.env.PAYMENT_MOCK === 'true'
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // 功能开关
  features: {
    offlineStorage: process.env.FEATURE_OFFLINE_STORAGE === 'true',
    dataExport: process.env.FEATURE_DATA_EXPORT !== 'false'
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: process.env.LOG_TO_FILE === 'true'
  }
};

module.exports = config; 