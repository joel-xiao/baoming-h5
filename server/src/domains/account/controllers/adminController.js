const container = require('@common/di/Container');
const AdminService = require('../services/AdminService');

// 一次性解析常用依赖
const logger = container.resolve('logger');
const responseFormatter = container.resolve('responseFormatter');

/**
 * 获取所有管理员
 * @route GET /api/account/admin/list
 * @access 私有 (Admin)
 */
const getAllAdmins = async (req, res) => {
  try {
    const result = await AdminService.getAllUsers();
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message);
  } catch (error) {
    logger.error(`获取管理员列表错误: ${error.message}`);
    return responseFormatter.error(res, '获取管理员列表时发生错误');
  }
};

/**
 * 创建管理员
 * @route POST /api/account/admin/create
 * @access 私有 (Admin)
 */
const createAdmin = async (req, res) => {
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
 * 更新管理员状态
 * @route PUT /api/account/admin/:id/status
 * @access 私有 (Admin)
 */
const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 只更新状态字段
    const result = await AdminService.updateUser(id, { status }, req.user._id);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, '更新管理员状态成功');
  } catch (error) {
    logger.error(`更新管理员状态错误: ${error.message}`);
    return responseFormatter.error(res, '更新管理员状态时发生错误');
  }
};

/**
 * 删除管理员
 * @route DELETE /api/account/admin/:id
 * @access 私有 (Admin)
 */
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteUser(id, req.user._id);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, null, '删除管理员成功');
  } catch (error) {
    logger.error(`删除管理员错误: ${error.message}`);
    return responseFormatter.error(res, '删除管理员时发生错误');
  }
};

module.exports = {
  getAllAdmins,
  createAdmin,
  updateAdminStatus,
  deleteAdmin
}; 