const container = require('@common/di/Container');
const AuthService = require('../services/AuthService');

// 一次性解析常用依赖
const logger = container.resolve('logger');
const responseFormatter = container.resolve('responseFormatter');

/**
 * 管理员登录
 * @route POST /api/account/login
 * @access 公开
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await AuthService.login(username, password);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message);
  } catch (error) {
    logger.error(`登录错误: ${error.message}`);
    return responseFormatter.error(res, '登录过程中发生错误');
  }
};

/**
 * 退出登录
 * @route POST /api/account/logout
 * @access 私有
 */
const logout = async (req, res) => {
  try {
    return responseFormatter.success(res, null, '成功退出登录');
  } catch (error) {
    logger.error(`退出登录错误: ${error.message}`);
    return responseFormatter.error(res, '退出过程中发生错误');
  }
};

/**
 * 获取当前用户信息
 * @route GET /api/account/me
 * @access 私有
 */
const getCurrentUser = async (req, res) => {
  try {
    const result = await AuthService.getCurrentUser(req.user._id);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, result.data, result.message);
  } catch (error) {
    logger.error(`获取用户信息错误: ${error.message}`);
    return responseFormatter.error(res, '获取用户信息时发生错误');
  }
};

/**
 * 修改密码
 * @route PUT /api/account/password
 * @access 私有
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const result = await AuthService.changePassword(req.user._id, currentPassword, newPassword);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, null, result.message);
  } catch (error) {
    logger.error(`修改密码错误: ${error.message}`);
    return responseFormatter.error(res, '修改密码时发生错误');
  }
};

/**
 * 发送密码重置邮件
 * @route POST /api/account/password/reset
 * @access 公开
 */
const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await AuthService.sendPasswordResetEmail(email);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, null, result.message);
  } catch (error) {
    logger.error(`发送密码重置邮件错误: ${error.message}`);
    return responseFormatter.error(res, '发送重置邮件时发生错误');
  }
};

/**
 * 重置密码
 * @route PUT /api/account/password/reset/:token
 * @access 公开
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const result = await AuthService.resetPassword(token, password);
    
    if (!result.success) {
      return responseFormatter.customResponse(res, result.status, result.message);
    }
    
    return responseFormatter.success(res, null, result.message);
  } catch (error) {
    logger.error(`重置密码错误: ${error.message}`);
    return responseFormatter.error(res, '重置密码时发生错误');
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  changePassword,
  sendPasswordResetEmail,
  resetPassword
}; 