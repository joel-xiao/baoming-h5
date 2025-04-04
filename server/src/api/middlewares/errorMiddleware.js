const logger = require('../../core/utils/Logger');
const { ResponseUtil } = require('../../core/utils/ResponseUtil');

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
  
  // 使用ResponseUtil处理不同类型的错误响应
  switch (statusCode) {
    case 400:
      return ResponseUtil.badRequest(res, message);
    case 401:
      return ResponseUtil.unauthorized(res, message);
    case 403:
      return ResponseUtil.forbidden(res, message);
    case 404:
      return ResponseUtil.notFound(res, message);
    default:
      return ResponseUtil.serverError(res, message, err);
  }
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
      return ResponseUtil.badRequest(res, '请求数据验证失败', errorMessages);
    }
    
    // 如果是自定义验证错误
    logger.warn(`验证错误: ${err.message}`);
    return ResponseUtil.badRequest(res, '请求数据验证失败', [err.message]);
  }
  
  // 如果不是验证错误，传递给下一个错误处理中间件
  next(err);
};

module.exports = {
  notFoundMiddleware,
  errorHandlerMiddleware,
  validationErrorMiddleware
}; 