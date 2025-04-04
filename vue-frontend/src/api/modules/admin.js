/**
 * 管理员相关API
 */
import apiInstance from '../core/axios';
import { withCache } from '../core/cache';

/**
 * 获取统计面板数据
 * @param {Object} params - 查询参数
 * @param {string} params.period - 统计周期 (today/week/month/year)，默认today
 * @returns {Promise<Object>} 统计数据
 */
export const getDashboard = async (params = {}) => {
  return await apiInstance.get('/admin/dashboard', { params });
};

/**
 * 获取所有报名记录
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.limit - 每页数量，默认20
 * @param {string} params.status - 筛选状态
 * @param {string} params.search - 搜索关键词
 * @param {string} params.category - 赛事类别
 * @param {string} params.sort - 排序字段
 * @param {string} params.order - 排序方向 (asc/desc)
 * @returns {Promise<Object>} 报名记录列表
 */
export const getRegistrations = async (params = {}) => {
  return await apiInstance.get('/admin/registrations', { params });
};

/**
 * 导出报名数据
 * @param {Object} params - 导出参数
 * @param {string} params.format - 导出格式 (csv/excel)，默认excel
 * @param {string} params.status - 筛选状态
 * @param {string} params.category - 赛事类别
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @returns {Promise<Blob>} 导出文件的Blob对象
 */
export const exportRegistrations = async (params = {}) => {
  return await apiInstance.get('/admin/export/registrations', { 
    params,
    responseType: 'blob' // 用于下载文件
  });
};

/**
 * 管理员登录
 * @param {Object} data - 登录信息
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise<Object>} 登录结果
 * @access public - 公开接口，不需要鉴权
 */
export const login = async (data) => {
  return await apiInstance.post('/admin/login', data);
};

/**
 * 审核报名
 * @param {string} id - 报名ID
 * @param {Object} data - 审核数据
 * @param {string} data.status - 审核状态 (approved/rejected)
 * @param {string} data.remarks - 审核备注，拒绝时必填
 * @returns {Promise<Object>} 审核结果
 */
export const reviewRegistration = async (id, data) => {
  return await apiInstance.put(`/registration/${id}/review`, data);
};

/**
 * 获取系统配置
 * @returns {Promise<Object>} 系统配置
 */
export const getConfig = async () => {
  return await apiInstance.get('/admin/config');
};

/**
 * 更新系统配置
 * @param {Object} data - 配置数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateConfig = async (data) => {
  return await apiInstance.put('/admin/config', data);
};

/**
 * 获取管理员用户列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.limit - 每页数量，默认20
 * @param {string} params.role - 筛选角色
 * @param {string} params.status - 筛选状态
 * @param {string} params.search - 搜索关键词
 * @returns {Promise<Object>} 用户列表
 */
export const getUsers = async (params = {}) => {
  return await apiInstance.get('/admin/users', { params });
};

/**
 * 创建管理员账号
 * @param {Object} data - 用户数据
 * @returns {Promise<Object>} 创建结果
 */
export const createUser = async (data) => {
  return await apiInstance.post('/admin/users', data);
};

/**
 * 更新管理员账号
 * @param {string} id - 用户ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateUser = async (id, data) => {
  return await apiInstance.put(`/admin/users/${id}`, data);
};

/**
 * 删除管理员账号
 * @param {string} id - 用户ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteUser = async (id) => {
  return await apiInstance.delete(`/admin/users/${id}`);
};

/**
 * 重置管理员密码
 * @param {string} id - 用户ID
 * @param {Object} data - 密码数据
 * @param {string} data.newPassword - 新密码
 * @returns {Promise<Object>} 重置结果
 */
export const resetUserPassword = async (id, data) => {
  return await apiInstance.post(`/admin/users/${id}/reset-password`, data);
};

/**
 * 获取系统日志
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 日志列表
 */
export const getLogs = async (params = {}) => {
  return await apiInstance.get('/admin/logs', { params });
};

// 使用缓存优化获取统计数据
export const getCachedDashboard = withCache(getDashboard, {
  cacheTime: 60 * 1000 // 1分钟缓存
});

// 导出所有API
export default {
  getDashboard,
  getRegistrations,
  exportRegistrations,
  login,
  reviewRegistration,
  getConfig,
  updateConfig,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getLogs,
  getCachedDashboard
}; 