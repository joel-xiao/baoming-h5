/**
 * 管理员相关API
 */
import apiInstance from '../core/axios';
import { handleApiError } from '../core/errorHandler';
import { withCache } from '../core/cache';

/**
 * 获取统计数据
 * @returns {Promise<Object>} 统计数据
 */
export const getStats = async () => {
  try {
    return await apiInstance.get('/admin/stats');
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 记录浏览量
 * @returns {Promise<Object>} 浏览量记录结果
 */
export const recordView = async () => {
  try {
    return await apiInstance.post('/admin/record-view');
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 获取所有报名记录
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 支付状态
 * @returns {Promise<Object>} 报名记录列表
 */
export const getRegistrations = async (params = {}) => {
  try {
    return await apiInstance.get('/admin/registrations', { params });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 导出报名数据
 * @param {Object} params - 导出参数
 * @param {string} params.status - 支付状态
 * @param {string} params.format - 导出格式
 * @returns {Promise<Blob>} 导出文件的Blob对象
 */
export const exportData = async (params = {}) => {
  try {
    return await apiInstance.get('/admin/export', { 
      params,
      responseType: 'blob' // 用于下载文件
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 管理员登录
 * @param {Object} data - 登录数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise<Object>} 登录结果
 */
export const login = async (data) => {
  try {
    return await apiInstance.post('/admin/login', data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 更新报名状态
 * @param {string} id - 报名ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateRegistration = async (id, data) => {
  try {
    return await apiInstance.put(`/admin/registration/${id}`, data);
  } catch (error) {
    return handleApiError(error);
  }
};

// 使用缓存优化获取统计数据
export const getCachedStats = withCache(getStats, {
  cacheTime: 60 * 1000 // 1分钟缓存
});

// 导出所有API
export default {
  getStats,
  recordView,
  getRegistrations,
  exportData,
  login,
  updateRegistration,
  getCachedStats
}; 