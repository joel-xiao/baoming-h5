/**
 * API核心 - Axios实例配置
 */
import axios from 'axios';
import config from '../../config';

// 创建API实例
const apiInstance = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiInstance.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 处理服务器返回的错误
      console.error('API错误:', error.response.data);
      
      // 如果是401未授权，可能需要重新登录
      if (error.response.status === 401) {
        // 清除token并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // 使用路由导航到登录页（需在组件中处理）
        // 也可以触发一个全局事件，由全局监听器处理
        const authErrorEvent = new CustomEvent('auth-error', {
          detail: { status: 401, message: '登录已过期，请重新登录' }
        });
        window.dispatchEvent(authErrorEvent);
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // 请求发送但没有收到响应
      console.error('网络错误，服务器未响应');
      
      // 如果启用了离线存储，可以在这里切换到离线模式
      if (config.features.offlineStorage) {
        // 实现离线存储逻辑
      }
      
      return Promise.reject({
        success: false,
        message: '网络错误，无法连接到服务器',
        error: 'NETWORK_ERROR'
      });
    } else {
      // 请求设置触发的错误
      console.error('请求错误:', error.message);
      
      return Promise.reject({
        success: false,
        message: '请求错误: ' + error.message,
        error: 'REQUEST_ERROR'
      });
    }
  }
);

export default apiInstance; 