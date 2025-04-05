/**
 * 基础服务类
 * 为所有领域服务提供通用功能和依赖解析
 */
const container = require('@common/di/Container');

class BaseService {
  /**
   * 基础服务构造函数
   * 自动注入通用依赖
   */
  constructor() {
    // 自动注入常用依赖
    this.logger = container.resolve('logger');
    this.emailService = container.resolve('emailService');
    
    // 初始化当前服务
    this.init();
  }
  
  /**
   * 初始化方法
   * 由子类实现特定初始化逻辑
   */
  init() {
    // 子类可以覆盖此方法进行特定初始化
  }
  
  /**
   * 发送电子邮件
   * @param {Object} mailOptions - 邮件配置选项
   * @returns {Promise<void>}
   */
  async sendEmail(mailOptions) {
    try {
      await this.emailService.sendEmail(mailOptions);
      this.logger.info(`邮件已发送: ${mailOptions.to}`);
    } catch (error) {
      this.logger.error(`发送邮件失败: ${error.message}`);
    }
  }
  
  /**
   * 记录信息日志
   * @param {string} message - 日志信息
   */
  logInfo(message) {
    this.logger.info(message);
  }
  
  /**
   * 记录警告日志
   * @param {string} message - 警告信息
   */
  logWarn(message) {
    this.logger.warn(message);
  }
  
  /**
   * 记录错误日志
   * @param {string} message - 错误信息
   * @param {Error} error - 错误对象
   */
  logError(message, error) {
    this.logger.error(`${message}: ${error ? error.message : '未知错误'}`);
  }

  /**
   * 获取数据访问对象
   * 子类应该重写此方法以提供具体实现
   * @returns {Object} 数据访问对象
   */
  getDataAccess() {
    return null;
  }

  /**
   * 成功响应
   * @param {Object} data - 响应数据
   * @param {string} message - 成功消息
   * @param {number} status - HTTP状态码
   * @returns {Object} 格式化的响应对象
   */
  successResponse(data = null, message = '操作成功', status = 200) {
    return {
      success: true,
      status,
      data,
      message
    };
  }

  /**
   * 错误响应
   * @param {string} message - 错误消息
   * @param {number} status - HTTP状态码
   * @param {Error} error - 错误对象
   * @returns {Object} 格式化的错误响应对象
   */
  errorResponse(message = '操作失败', status = 500, error = null) {
    this.logError(message, error || new Error(message));
    
    return {
      success: false,
      status,
      message
    };
  }

  /**
   * 验证必填参数
   * @param {Object} data - 要验证的数据
   * @param {Array<string>} requiredFields - 必填字段列表
   * @returns {Object|null} 如果验证失败，返回错误对象，否则返回null
   */
  validateRequired(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return this.errorResponse(
        `缺少必填字段: ${missingFields.join(', ')}`,
        400
      );
    }
    
    return null;
  }
}

module.exports = BaseService; 