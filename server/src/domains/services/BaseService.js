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
    this.idGenerator = container.resolve('idGenerator');
    
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
      // 继续执行，不抛出异常
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
   * 记录调试日志
   * @param {string} message - 调试信息
   */
  logDebug(message) {
    this.logger.debug(message);
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
    if (!this.modelFactory) {
      this.modelFactory = container.resolve('modelFactory');
    }
    return null;
  }

  /**
   * 生成唯一ID
   * @param {string} type - ID类型 (可选: 'registration', 'team', 'payment', 'invite')
   * @returns {string} 生成的ID
   */
  generateId(type = 'default') {
    switch (type) {
      case 'registration':
        return this.idGenerator.generateRegistrationOrderId();
      case 'team':
        return this.idGenerator.generateTeamOrderId();
      case 'payment':
        return this.idGenerator.generatePaymentOrderId();
      case 'invite':
        return this.idGenerator.generateInviteCode();
      default:
        return this.idGenerator.generateUniqueId();
    }
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
      message,
      error: error ? (process.env.NODE_ENV === 'production' ? error.message : error) : null
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

  /**
   * 包装异常处理
   * 为异步方法提供统一的异常处理
   * @param {Function} fn - 要执行的异步函数
   * @param {Object} options - 配置选项
   * @returns {Function} 包装后的函数
   */
  wrapAsync(fn, options = {}) {
    const { 
      logError = true, 
      rethrow = false, 
      defaultErrorMessage = '操作执行失败'
    } = options;
    
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (logError) {
          this.logError(defaultErrorMessage, error);
        }
        
        if (rethrow) {
          throw error;
        }
        
        return this.errorResponse(
          error.message || defaultErrorMessage,
          error.status || 500,
          error
        );
      }
    };
  }

  /**
   * 检查重复记录
   * @param {Function} findFn - 查找函数
   * @param {Object} query - 查询条件
   * @param {string} errorMessage - 重复时的错误消息
   * @returns {Promise<Object|null>} 如果存在重复，返回错误对象，否则返回null
   */
  async checkDuplicate(findFn, query, errorMessage) {
    const records = await findFn(query);
    
    if (records && (Array.isArray(records) ? records.length > 0 : records)) {
      return this.errorResponse(errorMessage, 400);
    }
    
    return null;
  }

  /**
   * 转换为日期对象
   * @param {string|Date} date - 日期字符串或对象
   * @returns {Date} 日期对象
   */
  toDate(date) {
    if (!date) return new Date();
    return date instanceof Date ? date : new Date(date);
  }

  /**
   * 格式化日期
   * @param {string|Date} date - 日期字符串或对象
   * @param {string} format - 格式化模板
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    date = this.toDate(date);
    const values = {
      'YYYY': date.getFullYear(),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'DD': String(date.getDate()).padStart(2, '0'),
      'HH': String(date.getHours()).padStart(2, '0'),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'ss': String(date.getSeconds()).padStart(2, '0')
    };
    
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => values[match]);
  }
}

module.exports = BaseService; 