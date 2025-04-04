const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const logger = require('../../core/utils/Logger');
const appConfig = require('../../config/app');

/**
 * CORS中间件配置
 * 配置跨域资源共享
 */
const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = appConfig.security.cors.origins.split(',');
    
    // 允许指定的来源或者没有来源（如移动应用）
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('不允许的跨域请求'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24小时
});

/**
 * Helmet安全头配置
 * 设置各种HTTP头以增强安全性
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: process.env.NODE_ENV === 'production',
  crossOriginResourcePolicy: process.env.NODE_ENV === 'production',
  dnsPrefetchControl: true,
  expectCt: false,
  frameguard: true,
  hidePoweredBy: true,
  hsts: process.env.NODE_ENV === 'production',
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: false,
  permittedCrossDomainPolicies: false,
  referrerPolicy: true,
  xssFilter: true
});

/**
 * XSS防护中间件
 * 防止跨站脚本攻击
 */
const xssMiddleware = xss();

/**
 * MongoDB数据净化
 * 防止NoSQL注入攻击
 */
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_'
});

/**
 * HTTP参数污染防护
 * 防止参数污染攻击
 */
const hppMiddleware = hpp();

/**
 * Cookie解析中间件
 */
const cookieParserMiddleware = cookieParser(appConfig.security.cookie.secret);

/**
 * CSRF防护中间件配置
 */
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

/**
 * API接口速率限制
 * 防止暴力破解和DOS攻击
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '请求次数过多，请稍后再试'
  }
});

/**
 * 登录接口速率限制
 * 更严格限制登录尝试
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 每个IP限制5次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '登录尝试次数过多，请1小时后再试'
  }
});

module.exports = {
  corsMiddleware,
  helmetMiddleware,
  xssMiddleware,
  mongoSanitizeMiddleware,
  hppMiddleware,
  cookieParserMiddleware,
  csrfProtection,
  apiLimiter,
  loginLimiter
}; 