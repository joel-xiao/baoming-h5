module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 7001,
  baseUrl: process.env.BASE_URL || 'http://localhost:7001',
  apiPrefix: process.env.API_PREFIX || '/api',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/baoming',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DB || 'baoming'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || 7
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:8080', 'http://localhost:3000']
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880)
  },
  
  mail: {
    host: process.env.MAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER || 'your_email@example.com',
      pass: process.env.MAIL_PASS || 'your_email_password'
    },
    from: process.env.MAIL_FROM || 'your_email@example.com'
  },
  
  wechatPay: {
    appId: process.env.WECHAT_PAY_APP_ID,
    mchId: process.env.WECHAT_PAY_MCH_ID,
    key: process.env.WECHAT_PAY_KEY,
    secret: process.env.WECHAT_PAY_SECRET,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL
  },
  
  alipay: {
    appId: process.env.ALIPAY_APP_ID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY,
    publicKey: process.env.ALIPAY_PUBLIC_KEY,
    notifyUrl: process.env.ALIPAY_NOTIFY_URL,
    returnUrl: process.env.ALIPAY_RETURN_URL,
    gateway: process.env.ALIPAY_GATEWAY
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || 10),
    enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
      max: parseInt(process.env.RATE_LIMIT_MAX || 100)
    }
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:8080'
  },
  
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || 3600)
  },
  
  dbType: process.env.DB_TYPE || 'mongodb'
}; 