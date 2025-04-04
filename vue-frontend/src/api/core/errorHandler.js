/**
 * API错误处理
 */

// 状态码常量
export const HTTP_STATUS = {
  OK: 200,                // 请求成功
  CREATED: 201,           // 资源创建成功
  BAD_REQUEST: 400,       // 请求参数错误
  UNAUTHORIZED: 401,      // 认证失败
  FORBIDDEN: 403,         // 权限不足
  NOT_FOUND: 404,         // 资源不存在
  INTERNAL_ERROR: 500     // 服务器内部错误
};

// 错误类型常量
export const ERROR_TYPE = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_ERROR: 'REQUEST_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @returns {Object} 标准化的错误响应
 */
export const handleApiError = (error) => {
  // 如果是API直接返回的错误对象（已被拦截器处理）
  if (error && typeof error === 'object' && 'success' in error) {
    return error;
  }

  // 如果是响应错误
  if (error.response) {
    const { status, data } = error.response;

    // 如果响应中已有标准格式的错误信息
    if (data && typeof data === 'object' && 'message' in data) {
      return {
        success: false,
        message: data.message,
        status,
        errors: data.errors || null,
        error: data.error || getErrorType(status)
      };
    }

    // 否则构造标准错误响应
    return {
      success: false,
      message: getStatusMessage(status),
      status,
      error: getErrorType(status)
    };
  }

  // 网络错误
  if (error.request) {
    return handleNetworkError();
  }

  // 其他错误
  return handleRequestError(error);
};

/**
 * 获取HTTP状态码对应的错误类型
 * @param {number} status - HTTP状态码
 * @returns {string} 错误类型标识符
 */
const getErrorType = (status) => {
  const types = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    500: 'INTERNAL_SERVER_ERROR'
  };

  return types[status] || `ERROR_${status}`;
};

/**
 * 获取HTTP状态码对应的错误消息
 * @param {number} status - HTTP状态码
 * @returns {string} 错误消息
 */
export const getStatusMessage = (status) => {
  const messages = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '权限不足，无法访问',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
  };

  return messages[status] || `请求失败，状态码: ${status}`;
};

/**
 * 处理网络错误（请求发送但没有收到响应）
 * @returns {Object} 标准化的网络错误响应
 */
export const handleNetworkError = () => {
  return {
    success: false,
    message: '网络错误，无法连接到服务器',
    error: ERROR_TYPE.NETWORK_ERROR,
    status: 0
  };
};

/**
 * 处理请求错误（请求设置触发的错误）
 * @param {Error} error - 错误对象
 * @returns {Object} 标准化的请求错误响应
 */
export const handleRequestError = (error) => {
  return {
    success: false,
    message: error.message ? ('请求错误: ' + error.message) : '发生未知错误',
    error: ERROR_TYPE.REQUEST_ERROR,
    status: 0
  };
};

/**
 * 是否是认证错误
 * @param {Object} error - 错误对象
 * @returns {boolean} 是否是认证错误
 */
export const isAuthError = (error) => {
  return error && error.status === HTTP_STATUS.UNAUTHORIZED;
};

/**
 * 是否是权限错误
 * @param {Object} error - 错误对象
 * @returns {boolean} 是否是权限错误
 */
export const isPermissionError = (error) => {
  return error && error.status === HTTP_STATUS.FORBIDDEN;
};

/**
 * 是否是资源不存在错误
 * @param {Object} error - 错误对象
 * @returns {boolean} 是否是资源不存在错误
 */
export const isNotFoundError = (error) => {
  return error && error.status === HTTP_STATUS.NOT_FOUND;
};

export default { 
  handleApiError,
  handleNetworkError,
  handleRequestError,
  isAuthError,
  isPermissionError,
  isNotFoundError,
  HTTP_STATUS,
  ERROR_TYPE,
  getStatusMessage
}; 