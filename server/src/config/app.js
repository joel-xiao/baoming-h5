const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

module.exports = {
  // 应用名称
  name: '团队报名系统',

  // 环境配置
  env: process.env.NODE_ENV || 'development',

  // 应用端口
  port: process.env.PORT || 3000,

  // 基础URL
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  // API路由前缀
  apiPrefix: process.env.API_PREFIX || '/api',

  // 允许的跨域源
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:8080','http://127.0.0.1:8080'],

  // 安全相关配置
  security: {
    // JWT配置
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    
    // 加密强度
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    
    // XSS保护
    xssProtection: true,
    
    // CSRF保护
    csrfProtection: process.env.CSRF_PROTECTION === 'true',
    
    // 限流配置
    rateLimit: {
      enabled: process.env.ENABLE_RATE_LIMIT === 'true',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 最大请求数
    },
    
    // 安全头信息
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      hsts: process.env.NODE_ENV === 'production'
    }
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '7d'
  },
  
  // 上传文件配置
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 默认5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    dir: process.env.UPLOAD_DIR || 'uploads'
  },
  
  // 邮件配置
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    },
    from: process.env.MAIL_FROM || '报名系统 <noreply@example.com>'
  },
  
  // 缓存配置
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10) // 默认缓存时间（秒）
  },
  
  // 支付配置
  payment: {
    wechatPay: {
      appId: process.env.WECHAT_PAY_APP_ID,
      mchId: process.env.WECHAT_PAY_MCH_ID,
      key: process.env.WECHAT_PAY_KEY,
      secret: process.env.WECHAT_PAY_SECRET,
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/api/payment/notify/wechat`
    },
    alipay: {
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
      publicKey: process.env.ALIPAY_PUBLIC_KEY,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL,
      returnUrl: process.env.ALIPAY_RETURN_URL,
      gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipaydev.com/gateway.do',
      isDev: process.env.NODE_ENV !== 'production'
    }
  }
}; 