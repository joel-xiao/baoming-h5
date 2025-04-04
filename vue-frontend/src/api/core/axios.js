/**
 * API核心 - Axios实例配置
 */
import axios from 'axios';
import config from '../../config';
import errorHandler from './errorHandler';
import errorNotify from '../../utils/errorNotify';
import { 
  HTTP_STATUS, 
  getStatusMessage, 
  handleNetworkError, 
  handleRequestError,
  ERROR_TYPE
} from './errorHandler';

// 创建API实例
const apiInstance = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 处理错误并创建相应的事件
 * @param {Object} error - 错误对象
 * @returns {Promise} 被拒绝的Promise
 */
const handleError = (error) => {
  let errorResponse;
  
  // 处理不同类型的错误
  if (error.response) {
    // HTTP错误响应
    const { status, data } = error.response;
    
    // 优先使用服务器返回的错误消息，如果没有则使用预定义消息
    const errorMessage = (data && data.message) || getStatusMessage(status);
    
    // 处理错误显示细节
    let errorType = (data && data.errorType) || '';
    let errors = (data && data.errors) || null;
    
    // 根据状态码设置错误类型
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST: // 400: 请求参数错误
        errorType = errorType || 'warning';
        errorNotify.showWarning(errorMessage);
        break;
        
      case HTTP_STATUS.UNAUTHORIZED: // 401: 认证失败
        // 清除用户凭证
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        errorType = errorType || 'auth';
        errorNotify.showAuthError(errorMessage);
        break;
        
      case HTTP_STATUS.FORBIDDEN: // 403: 权限不足
      case HTTP_STATUS.NOT_FOUND: // 404: 资源不存在
        errorType = errorType || 'warning';
        errorNotify.showWarning(errorMessage);
        break;
        
      case HTTP_STATUS.INTERNAL_ERROR: // 500: 服务器内部错误
      default: // 其他错误
        errorType = errorType || 'error';
        errorNotify.showError({
          message: errorMessage,
          status,
          errorType,
          errors
        });
        break;
    }
    
    // 统一处理并返回格式化的错误对象
    errorResponse = errorHandler.handleApiError(error);
  } else if (error.request) {
    // 网络错误：请求已发送但没有收到响应
    errorResponse = errorHandler.handleNetworkError();
    
    // 如果启用了离线存储，可以在这里切换到离线模式
    if (config.features.offlineStorage) {
      // 实现离线存储逻辑
    }
    errorNotify.showNetworkError(errorResponse.message);
  } else {
    // 请求设置触发的错误
    errorResponse = errorHandler.handleRequestError(error);
    
    errorNotify.showError(errorResponse.message);
  }
  
  return Promise.reject(errorResponse);
};

// 请求拦截器
apiInstance.interceptors.request.use(
  (config) => {
    // 在请求头中添加token（如果有）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => handleError(error)
);

// 响应拦截器
apiInstance.interceptors.response.use(
  (response) => {
    // 处理成功响应 (2xx)
    // 状态码200: 请求成功
    // 状态码201: 资源创建成功
    const { status, data } = response;
    
    if (status === 200 || status === 201) {
      // 检查响应是否包含预期的数据格式
      if (data && typeof data === 'object') {
        // 已经是标准格式，直接返回
        return data;
      } else {
        // 不是标准格式，包装一下
        return {
          success: true,
          message: status === 201 ? '创建成功' : '请求成功',
          data: data
        };
      }
    }
    
    // 对于其他成功状态码，保持默认处理
    return response.data;
  },
  (error) => handleError(error)
);

export default apiInstance; 