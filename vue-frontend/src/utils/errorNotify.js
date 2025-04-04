/**
 * 错误通知工具
 * 用于统一发送错误事件，触发错误提示的显示
 */

/**
 * 显示错误提示
 * @param {Object} options - 错误选项
 * @param {string} options.message - 错误消息
 * @param {number} [options.status=500] - HTTP 状态码
 * @param {string} [options.errorType='error'] - 错误类型: error, warning, auth, network
 * @param {Object} [options.errors=null] - 错误详情
 */
export const showError = (options) => {
  if (typeof options === 'string') {
    options = { message: options };
  }

  const { message, status = 500, errorType = 'error', errors = null } = options;

  window.dispatchEvent(new CustomEvent('api-error', {
    detail: {
      message,
      status,
      errorType,
      errors
    }
  }));
};

/**
 * 显示认证错误
 * @param {string} message - 错误消息
 */
export const showAuthError = (message) => {
  window.dispatchEvent(new CustomEvent('auth-error', {
    detail: {
      message,
      errorType: 'auth'
    }
  }));
};

/**
 * 显示警告提示
 * @param {string} message - 警告消息
 */
export const showWarning = (message) => {
  showError({
    message,
    errorType: 'warning',
    status: 400
  });
};

/**
 * 显示网络错误
 * @param {string} message - 错误消息
 */
export const showNetworkError = (message = '网络连接失败，请检查网络后重试') => {
  showError({
    message,
    errorType: 'network',
    status: 0
  });
};

export default {
  showError,
  showAuthError,
  showWarning,
  showNetworkError
}; 