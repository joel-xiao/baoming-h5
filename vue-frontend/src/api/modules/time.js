/**
 * 时间相关API
 */
import apiInstance from '../core/axios';
import { withCache } from '../core/cache';

/**
 * 获取服务器时间
 * @returns {Promise<Object>} 服务器时间信息
 * @access public - 公开接口，不需要鉴权
 */
export const getServerTime = async () => {
  return await apiInstance.get('/time/server-time');
};

// 使用缓存优化获取服务器时间
export const getCachedServerTime = withCache(getServerTime, {
  cacheTime: 30 * 1000 // 30秒缓存
});

// 导出所有API
export default {
  getServerTime,
  getCachedServerTime
}; 