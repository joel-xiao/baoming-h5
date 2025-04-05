const container = require('@common/di/Container');
const AdminService = require('../services/AdminService');

// 一次性解析常用依赖
const logger = container.resolve('logger');
const responseFormatter = container.resolve('responseFormatter');

/**
 * 获取所有注册记录
 * @route GET /api/admin/registrations
 * @access 私有 管理员
 */
const getAllRegistrations = async (req, res) => {
  try {
    const result = await AdminService.getAllRegistrations(req.query);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message);
  } catch (error) {
    logger.error(`获取注册记录错误: ${error.message}`);
    return responseFormatter.error(res, '获取注册记录时发生错误');
  }
};

/**
 * 获取统计数据
 * @route GET /api/admin/stats
 * @access 私有 管理员
 */
const getStats = async (req, res) => {
  try {
    const result = await AdminService.getStats();
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message);
  } catch (error) {
    logger.error(`获取统计数据错误: ${error.message}`);
    return responseFormatter.error(res, '获取统计数据时发生错误');
  }
};

/**
 * 导出注册数据
 * @route GET /api/admin/export/registrations
 * @access 私有 管理员
 */
const exportRegistrations = async (req, res) => {
  try {
    const result = await AdminService.exportRegistrations(req.query);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    // 设置响应头
    res.setHeader('Content-Type', result.data.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${result.data.filename}`);
    
    // 发送文件
    res.send(result.data.data);
  } catch (error) {
    logger.error(`导出注册数据错误: ${error.message}`);
    return responseFormatter.error(res, '导出注册数据时发生错误');
  }
};

/**
 * 导出支付数据
 * @route GET /api/admin/export/payments
 * @access 私有 管理员
 */
const exportPayments = async (req, res) => {
  try {
    const result = await AdminService.exportPayments(req.query);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    // 设置响应头
    res.setHeader('Content-Type', result.data.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${result.data.filename}`);
    
    // 发送文件
    res.send(result.data.data);
  } catch (error) {
    logger.error(`导出支付数据错误: ${error.message}`);
    return responseFormatter.error(res, '导出支付数据时发生错误');
  }
};

/**
 * 获取所有管理员用户
 * @route GET /api/admin/users
 * @access 私有 管理员
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await AdminService.getAllUsers();
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message);
  } catch (error) {
    logger.error(`获取管理员用户错误: ${error.message}`);
    return responseFormatter.error(res, '获取管理员用户时发生错误');
  }
};

/**
 * 创建管理员用户
 * @route POST /api/admin/users
 * @access 私有 超级管理员
 */
const createUser = async (req, res) => {
  try {
    const result = await AdminService.createUser(req.body, req.user._id);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message, result.status);
  } catch (error) {
    logger.error(`创建管理员错误: ${error.message}`);
    return responseFormatter.error(res, '创建管理员时发生错误');
  }
};

/**
 * 更新管理员用户
 * @route PUT /api/admin/users/:id
 * @access 私有 超级管理员
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminService.updateUser(id, req.body, req.user._id);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message);
  } catch (error) {
    logger.error(`更新管理员错误: ${error.message}`);
    return responseFormatter.error(res, '更新管理员时发生错误');
  }
};

/**
 * 删除管理员用户
 * @route DELETE /api/admin/users/:id
 * @access 私有 超级管理员
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteUser(id, req.user._id);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, null, result.message);
  } catch (error) {
    logger.error(`删除管理员错误: ${error.message}`);
    return responseFormatter.error(res, '删除管理员时发生错误');
  }
};

module.exports = {
  getAllRegistrations,
  getStats,
  exportRegistrations,
  exportPayments,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
}; 