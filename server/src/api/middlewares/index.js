// 导入所有中间件
const { authMiddleware, adminMiddleware, superAdminMiddleware } = require('./authMiddleware');
const { notFoundMiddleware, errorHandlerMiddleware, validationErrorMiddleware } = require('./errorMiddleware');
const { validate, handleValidationError, validateRequestBody, allowFields } = require('./validationMiddleware');
const { requestLogger, requestId, detailedRequestLogger } = require('./loggingMiddleware');
const {
  corsMiddleware,
  helmetMiddleware,
  xssMiddleware,
  mongoSanitizeMiddleware,
  hppMiddleware,
  cookieParserMiddleware,
  csrfProtection,
  apiLimiter,
  loginLimiter
} = require('./securityMiddleware');
const { singleUpload, multiUpload, fieldsUpload, uploadDir } = require('./uploadMiddleware');

// 导出所有中间件
module.exports = {
  // 认证中间件
  auth: authMiddleware,
  admin: adminMiddleware,
  superAdmin: superAdminMiddleware,
  
  // 错误处理中间件
  notFound: notFoundMiddleware,
  errorHandler: errorHandlerMiddleware,
  validationError: validationErrorMiddleware,
  
  // 验证中间件
  validate,
  handleValidationError,
  validateRequestBody,
  allowFields,
  
  // 日志中间件
  requestLogger,
  requestId,
  detailedRequestLogger,
  
  // 安全中间件
  cors: corsMiddleware,
  helmet: helmetMiddleware,
  xss: xssMiddleware,
  mongoSanitize: mongoSanitizeMiddleware,
  hpp: hppMiddleware,
  cookieParser: cookieParserMiddleware,
  csrf: csrfProtection,
  apiLimiter,
  loginLimiter,
  
  // 上传中间件
  singleUpload,
  multiUpload,
  fieldsUpload,
  uploadDir
}; 