/**
 * 时间相关API
 */
import apiInstance from '../core/axios';
import { handleApiError } from '../core/errorHandler';
import { withCache } from '../core/cache';

/**
 * 获取服务器时间
 * @returns {Promise<Object>} 服务器时间信息
 */
export const getServerTime = async () => {
  try {
    return await apiInstance.get('/time/server-time');
  } catch (error) {
    return handleApiError(error);
  }
};

// 使用缓存优化获取服务器时间
export const getCachedServerTime = withCache(getServerTime, {
  cacheTime: 5 * 1000 // 5秒缓存
});

// 导出所有API
export default {
  getServerTime,
  getCachedServerTime
}; 