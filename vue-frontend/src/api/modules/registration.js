/**
 * 注册相关API
 */
import apiInstance from '../core/axios';
import { handleApiError } from '../core/errorHandler';
import { withCache } from '../core/cache';

/**
 * 获取最近报名记录
 * @returns {Promise<Object>} 报名记录列表
 */
export const getRegistrations = async () => {
  try {
    return await apiInstance.get('/registration');
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 创建队长报名
 * @param {Object} data - 队长报名数据
 * @param {string} data.name - 姓名
 * @param {string} data.phone - 电话
 * @param {string} data.openid - 微信openid
 * @returns {Promise<Object>} 创建结果
 */
export const createTeamLeader = async (data) => {
  try {
    return await apiInstance.post('/registration/leader', data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 加入团队
 * @param {Object} data - 加入团队数据
 * @param {string} data.name - 姓名
 * @param {string} data.phone - 电话
 * @param {string} data.openid - 微信openid
 * @param {string} data.teamId - 团队ID
 * @returns {Promise<Object>} 加入结果
 */
export const joinTeam = async (data) => {
  try {
    return await apiInstance.post('/registration/join', data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 获取团队成员
 * @param {string} teamId - 团队ID
 * @returns {Promise<Object>} 团队成员列表
 */
export const getTeamMembers = async (teamId) => {
  try {
    return await apiInstance.get(`/registration/team/${teamId}`);
  } catch (error) {
    return handleApiError(error);
  }
};

// 使用缓存优化获取函数
export const getCachedRegistrations = withCache(getRegistrations, {
  cacheTime: 30 * 1000 // 30秒缓存
});

export const getCachedTeamMembers = withCache(getTeamMembers, {
  cacheTime: 60 * 1000 // 1分钟缓存
});

// 导出所有API
export default {
  getRegistrations,
  createTeamLeader,
  joinTeam,
  getTeamMembers,
  getCachedRegistrations,
  getCachedTeamMembers
}; 