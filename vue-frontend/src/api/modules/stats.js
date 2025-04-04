/**
 * 统计相关API
 */
import apiInstance from '../core/axios';
import { handleApiError } from '../core/errorHandler';
import { withCache } from '../core/cache';

/**
 * 记录页面浏览量
 * @returns {Promise<Object>} 记录结果
 */
export const recordView = async () => {
  try {
    return await apiInstance.post('/stats/record-view');
  } catch (error) {
    return handleApiError(error);
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
    return handleApiError(error);
  }
};

// 使用缓存优化获取公开统计数据
export const getCachedPublicStats = withCache(getPublicStats, {
  cacheTime: 60 * 1000 // 1分钟缓存
});

// 导出所有API
export default {
  recordView,
  getPublicStats,
  getCachedPublicStats
}; 