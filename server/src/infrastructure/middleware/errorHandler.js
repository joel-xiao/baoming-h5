const logger = require('../utils/helper/Logger');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 日志记录错误
  logger.error(`错误: ${err.message}`);
  logger.error(err.stack);

  // 设置默认状态码和消息
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  // API错误响应
  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      ...err
    } : undefined
  });
};

module.exports = errorHandler; 