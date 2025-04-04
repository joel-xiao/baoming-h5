/**
 * API错误处理
 */

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
        error: data.error || 'API_ERROR'
      };
    }

    // 否则构造标准错误响应
    return {
      success: false,
      message: getStatusMessage(status),
      status,
      error: 'API_ERROR'
    };
  }

  // 网络错误
  if (error.request) {
    return {
      success: false,
      message: '网络错误，无法连接到服务器',
      error: 'NETWORK_ERROR'
    };
  }

  // 其他错误
  return {
    success: false,
    message: error.message || '发生未知错误',
    error: 'UNKNOWN_ERROR'
  };
};

/**
 * 获取HTTP状态码对应的错误消息
 * @param {number} status - HTTP状态码
 * @returns {string} 错误消息
 */
const getStatusMessage = (status) => {
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

export default { handleApiError }; 