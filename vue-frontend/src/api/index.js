/**
 * API模块统一导出
 */

// 导入API模块
import * as registrationModule from './modules/registration';
import * as paymentModule from './modules/payment';
import * as adminModule from './modules/admin';
import * as timeModule from './modules/time';

// 导入核心模块
import apiInstance from './core/axios';
import errorHandler from './core/errorHandler';
import cache from './core/cache';

// 导入hooks
import * as apiHooks from './hooks/useApi';

// 以命名导出方式导出各模块API
export const registrationApi = registrationModule;
export const paymentApi = paymentModule;
export const adminApi = adminModule;
export const timeApi = timeModule;

// 导出核心模块
export const api = apiInstance;
export const apiCache = cache;
export const apiError = errorHandler;

// 导出hooks
export const useApi = apiHooks.useApi;
export const usePagination = apiHooks.usePagination;

/**
 * 全局API初始化配置
 * @param {Object} options - 配置选项
 */
export const setupApi = (options = {}) => {
  const { baseURL, timeout, extraHeaders } = options;
  
  // 更新baseURL
  if (baseURL) {
    apiInstance.defaults.baseURL = baseURL;
  }
  
  // 更新timeout
  if (timeout) {
    apiInstance.defaults.timeout = timeout;
  }
  
  // 添加额外的头信息
  if (extraHeaders && typeof extraHeaders === 'object') {
    Object.keys(extraHeaders).forEach(key => {
      apiInstance.defaults.headers.common[key] = extraHeaders[key];
    });
  }
};

// 导出默认对象，保持向后兼容
export default {
  // 各模块API
  registration: registrationApi,
  payment: paymentApi,
  admin: adminApi,
  time: timeApi,
  
  // 核心模块
  core: {
    instance: apiInstance,
    error: errorHandler,
    cache
  },
  
  // 工具函数
  setup: setupApi,
  
  // Hooks
  hooks: {
    useApi,
    usePagination
  }
}; 