/**
 * API错误处理工具
 */

// 通用错误消息
const ERROR_MESSAGES = {
  NETWORK: '网络连接失败，请检查您的网络',
  SERVER: '服务器错误，请稍后再试',
  TIMEOUT: '请求超时，请稍后再试',
  UNAUTHORIZED: '登录已过期，请重新登录',
  NOT_FOUND: '请求的资源不存在',
  GENERAL: '请求失败，请稍后再试'
};

/**
 * 获取友好的错误消息
 * @param {Error} error - 捕获的错误对象
 * @returns {string} 友好的错误消息
 */
export const getFriendlyErrorMessage = (error) => {
  if (!error) {
    return ERROR_MESSAGES.GENERAL;
  }

  // 网络错误
  if (!error.response && error.request) {
    return ERROR_MESSAGES.NETWORK;
  }

  // 超时错误
  if (error.code === 'ECONNABORTED') {
    return ERROR_MESSAGES.TIMEOUT;
  }

  // 服务器返回的错误
  if (error.response) {
    const { status, data } = error.response;
    
    // 优先使用服务器返回的错误消息
    if (data && data.message) {
      return data.message;
    }
    
    // 根据状态码返回友好消息
    switch (status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
        return ERROR_MESSAGES.SERVER;
      default:
        return ERROR_MESSAGES.GENERAL;
    }
  }
  
  // 返回错误消息或默认消息
  return error.message || ERROR_MESSAGES.GENERAL;
};

/**
 * 处理API错误，并返回标准化的错误响应
 * @param {Error} error - 捕获的错误对象
 * @returns {Object} 标准化的错误响应对象
 */
export const handleApiError = (error) => {
  const errorMessage = getFriendlyErrorMessage(error);
  console.error('API请求失败:', errorMessage, error);
  
  return {
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  };
};

export default {
  getFriendlyErrorMessage,
  handleApiError
}; 