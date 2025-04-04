/**
 * ResponseUtil - API响应统一格式化工具
 * 用于统一服务端所有API的响应格式
 */

// HTTP状态码常量
const HTTP_STATUS = {
  OK: 200,                // 请求成功
  CREATED: 201,           // 资源创建成功
  BAD_REQUEST: 400,       // 请求参数错误
  UNAUTHORIZED: 401,      // 认证失败
  FORBIDDEN: 403,         // 权限不足
  NOT_FOUND: 404,         // 资源不存在
  INTERNAL_ERROR: 500     // 服务器内部错误
};

/**
 * API响应工具类
 */
class ResponseUtil {
  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 成功消息
   * @param {Object|Array} data - 响应数据
   * @param {Number} statusCode - HTTP状态码，默认200
   */
  static success(res, message = '操作成功', data = null, statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * 创建成功响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 成功消息
   * @param {Object|Array} data - 响应数据
   */
  static created(res, message = '创建成功', data = null) {
    return this.success(res, message, data, HTTP_STATUS.CREATED);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误消息
   * @param {Number} statusCode - HTTP状态码，默认400
   * @param {Array} errors - 错误详情列表
   */
  static error(res, message = '操作失败', statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) {
    const responseBody = {
      success: false,
      message
    };

    // 只在开发环境或有具体错误信息时添加错误详情
    if (errors) {
      responseBody.errors = errors;
    }

    return res.status(statusCode).json(responseBody);
  }

  /**
   * 参数错误响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误消息
   * @param {Array} errors - 错误详情列表
   */
  static badRequest(res, message = '请求参数错误', errors = null) {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  /**
   * 认证失败响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误消息
   */
  static unauthorized(res, message = '认证失败') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * 权限不足响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误消息
   */
  static forbidden(res, message = '权限不足') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * 资源不存在响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误消息
   */
  static notFound(res, message = '请求的资源不存在') {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * 服务器内部错误响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误消息
   * @param {Error} err - 错误对象，仅在开发环境使用
   */
  static serverError(res, message = '服务器内部错误', err = null) {
    const responseBody = {
      success: false,
      message
    };

    // 只在开发环境添加错误堆栈
    if (process.env.NODE_ENV === 'development' && err) {
      responseBody.stack = err.stack;
    }

    return res.status(HTTP_STATUS.INTERNAL_ERROR).json(responseBody);
  }
}

// 导出
module.exports = {
  ResponseUtil,
  HTTP_STATUS
}; 