/**
 * 全局错误处理中间件
 */
class ErrorHandler {
  /**
   * 创建错误处理中间件实例
   * @param {Object} logger - 日志服务
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * 处理请求过程中发生的错误
   * @param {Error} err - 错误对象
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  handle(err, req, res, next) {
    // 日志记录错误
    this.logger.error(`错误: ${err.message}`);
    this.logger.error(err.stack);

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
  }

  /**
   * 旧版静态工厂方法，用于向后兼容
   * @param {Error} err - 错误对象
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  static handle(err, req, res, next) {
    const container = req.app.get('container');
    const errorHandler = container.resolve('errorHandler');
    return errorHandler.handle(err, req, res, next);
  }
}

module.exports = ErrorHandler;
