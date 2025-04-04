/**
 * 后端配置文件
 * 基于环境变量实现，确保在应用启动前加载.env文件
 */

// 加载环境变量
require('dotenv').config();

// 环境变量兼容处理函数
const getEnv = (newKey, oldKey, defaultValue) => {
  return process.env[newKey] || process.env[oldKey] || defaultValue;
};

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
    uri: getEnv('DB_URI', 'MONGODB_URI', 'mongodb://localhost:27017/team_registration'),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true
    }
  },
  
  // 支付配置
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'wechat',
    appId: getEnv('PAYMENT_APP_ID', 'WECHAT_PAY_APP_ID'),
    mchId: getEnv('PAYMENT_MCH_ID', 'WECHAT_PAY_MCH_ID'),
    serialNumber: getEnv('PAYMENT_SERIAL_NUMBER', 'WECHAT_PAY_SERIAL_NUMBER'),
    notifyUrl: getEnv('PAYMENT_NOTIFY_URL', 'WECHAT_PAY_NOTIFY_URL'),
    mock: getEnv('PAYMENT_MOCK', 'WECHAT_PAY_MOCK') === 'true'
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

// 在开发环境下打印当前配置
if (config.app.environment === 'development') {
  // 过滤掉敏感信息
  const safeConfig = JSON.parse(JSON.stringify(config));
  if (safeConfig.jwt) safeConfig.jwt.secret = '******';
  if (safeConfig.payment) {
    safeConfig.payment.appId = safeConfig.payment.appId ? '******' : undefined;
    safeConfig.payment.mchId = safeConfig.payment.mchId ? '******' : undefined;
    safeConfig.payment.serialNumber = safeConfig.payment.serialNumber ? '******' : undefined;
  }
  console.log('当前配置:', JSON.stringify(safeConfig, null, 2));
}

module.exports = config; 