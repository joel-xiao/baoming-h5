/**
 * 注册相关API
 */
import apiInstance from '../core/axios';
import { withCache } from '../core/cache';

/**
 * 获取最近报名记录
 * @returns {Promise<Object>} 报名记录列表
 * @access public - 公开接口，不需要鉴权
 */
export const getRegistrations = async () => {
  return await apiInstance.get('/registration');
};

/**
 * 创建队长报名
 * @param {Object} data - 队长报名数据
 * @param {string} data.teamName - 团队名称
 * @param {string} data.name - 队长姓名
 * @param {string} data.gender - 队长性别 (male/female)
 * @param {string} data.phone - 队长电话
 * @param {string} data.email - 队长邮箱 (可选)
 * @param {string} data.eventId - 赛事ID
 * @param {string} data.categoryId - 赛事类别ID
 * @returns {Promise<Object>} 创建结果
 * @access public - 公开接口，不需要鉴权
 */
export const createTeamLeader = async (data) => {
  return await apiInstance.post('/registration/leader', data);
};

/**
 * 加入团队
 * @param {Object} data - 加入团队数据
 * @param {string} data.inviteCode - 邀请码
 * @param {string} data.name - 成员姓名
 * @param {string} data.gender - 成员性别 (male/female)
 * @param {string} data.phone - 成员电话
 * @param {string} data.email - 成员邮箱 (可选)
 * @param {string} data.idCard - 成员身份证号 (可选)
 * @returns {Promise<Object>} 加入结果
 * @access public - 公开接口，不需要鉴权
 */
export const joinTeam = async (data) => {
  return await apiInstance.post('/registration/join', data);
};

/**
 * 获取团队成员
 * @param {string} teamId - 团队ID
 * @returns {Promise<Object>} 团队成员列表
 * @access public - 公开接口，不需要鉴权
 */
export const getTeamMembers = async (teamId) => {
  return await apiInstance.get(`/registration/team/${teamId}`);
};

/**
 * 获取单个报名详情
 * @param {string} id - 报名记录ID
 * @returns {Promise<Object>} 报名详情
 * @access public - 公开接口，不需要鉴权
 */
export const getRegistrationDetail = async (id) => {
  return await apiInstance.get(`/registration/${id}`);
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
  getRegistrationDetail,
  getCachedRegistrations,
  getCachedTeamMembers
}; 