const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

/**
 * 日志服务类
 * 提供应用程序的日志记录功能
 */
class LoggerService {
  constructor() {
    // 确保日志目录存在
    this.logDir = path.join(__dirname, '../../../../logs');
    fs.ensureDirSync(this.logDir);
    
    // 初始化日志记录器
    this.logger = this._createLogger();
  }
  
  /**
   * 创建日志记录器实例
   * @private
   */
  _createLogger() {
    /**
     * 日志级别
     */
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4,
    };

    /**
     * 根据环境选择日志级别
     */
    const level = () => {
      const env = process.env.NODE_ENV || 'development';
      return env === 'development' ? 'debug' : 'info';
    };

    /**
     * 日志格式配置
     */
    const format = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    );

    /**
     * 控制台和文件处理器
     */
    const transports = [
      // 控制台输出
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          format
        ),
      }),
      // 错误日志文件
      new winston.transports.File({
        filename: path.join(this.logDir, 'error.log'),
        level: 'error',
      }),
      // 所有日志文件
      new winston.transports.File({
        filename: path.join(this.logDir, 'combined.log'),
      }),
    ];

    /**
     * 创建日志记录器
     */
    return winston.createLogger({
      level: level(),
      levels,
      format,
      transports,
    });
  }
  
  /**
   * 记录错误级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 附加元数据
   */
  error(message, meta) {
    this.logger.error(message, meta);
  }
  
  /**
   * 记录警告级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 附加元数据
   */
  warn(message, meta) {
    this.logger.warn(message, meta);
  }
  
  /**
   * 记录信息级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 附加元数据
   */
  info(message, meta) {
    this.logger.info(message, meta);
  }
  
  /**
   * 记录HTTP请求日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 附加元数据
   */
  http(message, meta) {
    this.logger.http(message, meta);
  }
  
  /**
   * 记录调试级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 附加元数据
   */
  debug(message, meta) {
    this.logger.debug(message, meta);
  }
}

module.exports = LoggerService; 