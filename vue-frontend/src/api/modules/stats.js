/**
 * 统计相关API
 */
import apiInstance from '../core/axios';
import { withCache } from '../core/cache';

/**
 * 记录页面浏览量
 * @returns {Promise<Object>} 记录结果
 */
export const recordView = async () => {
  try {
    return await apiInstance.post('/stats/record-view');
  } catch (error) {
    return error;
  }
};

/**
 * 获取公开统计数据
 * @returns {Promise<Object>} 统计数据
 */
export const getPublicStats = async () => {
  try {
    return await apiInstance.get('/stats/public');
  } catch (error) {
    return error;
  }
};

// 使用缓存优化获取公开统计数据
export const getCachedPublicStats = withCache(getPublicStats, {
  cacheTime: 60 * 1000 // 1分钟缓存
});

/**
 * 获取报名统计数据
 * @returns {Promise<Object>} 报名统计数据
 * @access public - 公开接口，不需要鉴权
 */
export const getRegistrationStats = async () => {
  // 直接返回请求结果，让axios拦截器处理错误
  return await apiInstance.get('/stats/registration');
};

/**
 * 获取支付统计数据
 * @returns {Promise<Object>} 支付统计数据
 * @access public - 公开接口，不需要鉴权
 */
export const getPaymentStats = async () => {
  // 直接返回请求结果，让axios拦截器处理错误
  return await apiInstance.get('/stats/payment');
};

// 带缓存的版本
export const getCachedRegistrationStats = withCache(getRegistrationStats, {
  cacheTime: 5 * 60 * 1000 // 5分钟缓存
});

export const getCachedPaymentStats = withCache(getPaymentStats, {
  cacheTime: 5 * 60 * 1000 // 5分钟缓存
});

// 导出所有API
export default {
  recordView,
  getPublicStats,
  getCachedPublicStats,
  getRegistrationStats,
  getPaymentStats,
  getCachedRegistrationStats,
  getCachedPaymentStats
}; 