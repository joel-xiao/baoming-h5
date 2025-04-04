const logger = require('../../core/utils/Logger');

/**
 * 404错误处理中间件
 * 处理找不到的路由
 */
const notFoundMiddleware = (req, res, next) => {
  const error = new Error(`找不到资源: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * 全局错误处理中间件
 * 捕获应用程序中的所有错误
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  // 从错误对象中获取状态码和消息
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  // 日志记录错误
  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }
  
  // 响应错误消息
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * 验证错误处理中间件
 * 处理请求验证错误
 */
const validationErrorMiddleware = (err, req, res, next) => {
  // 检查是否是验证错误
  if (err.name === 'ValidationError') {
    // 如果是Mongoose验证错误
    if (err.errors) {
      const errorMessages = Object.values(err.errors).map(error => error.message);
      logger.warn(`验证错误: ${errorMessages.join(', ')}`);
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: errorMessages
      });
    }
    
    // 如果是自定义验证错误
    logger.warn(`验证错误: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: '请求数据验证失败',
      errors: [err.message]
    });
  }
  
  // 如果不是验证错误，传递给下一个错误处理中间件
  next(err);
};

module.exports = {
  notFoundMiddleware,
  errorHandlerMiddleware,
  validationErrorMiddleware
}; 