const authService = require('../services/AuthService');
const { ResponseUtil } = require('../../../../../infrastructure/utils/helper/ResponseUtil');
const logger = require('../../../../../infrastructure/utils/helper/Logger');

/**
 * 管理员登录
 * @route POST /api/auth/login
 * @access 公开
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await authService.login(username, password);
    
    if (!result.success) {
      return ResponseUtil.customResponse(res, result.status, result.message);
    }
    
    return ResponseUtil.success(res, result.message, result.data);
  } catch (error) {
    logger.error(`登录错误: ${error.message}`);
    return ResponseUtil.serverError(res, '登录过程中发生错误', error);
  }
};

/**
 * 刷新令牌
 * @route POST /api/auth/refresh
 * @access 公开
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const result = await authService.refreshToken(refreshToken);
    
    if (!result.success) {
      return ResponseUtil.customResponse(res, result.status, result.message);
    }
    
    return ResponseUtil.success(res, result.message, result.data);
  } catch (error) {
    logger.error(`刷新令牌错误: ${error.message}`);
    return ResponseUtil.serverError(res, '刷新令牌过程中发生错误', error);
  }
};

/**
 * 退出登录
 * @route POST /api/auth/logout
 * @access 私有
 */
const logout = async (req, res) => {
  try {
    // 这里不做任何令牌黑名单操作，因为JWT是无状态的
    // 客户端应删除令牌
    
    return ResponseUtil.success(res, '成功退出登录');
  } catch (error) {
    logger.error(`退出登录错误: ${error.message}`);
    return ResponseUtil.serverError(res, '退出过程中发生错误', error);
  }
};

/**
 * 获取当前用户信息
 * @route GET /api/auth/me
 * @access 私有
 */
const getCurrentUser = async (req, res) => {
  try {
    const result = await authService.getCurrentUser(req.user._id);
    
    if (!result.success) {
      return ResponseUtil.customResponse(res, result.status, result.message);
    }
    
    return ResponseUtil.success(res, result.message, result.data);
  } catch (error) {
    logger.error(`获取用户信息错误: ${error.message}`);
    return ResponseUtil.serverError(res, '获取用户信息时发生错误', error);
  }
};

/**
 * 修改密码
 * @route PUT /api/auth/password
 * @access 私有
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    
    if (!result.success) {
      return ResponseUtil.customResponse(res, result.status, result.message);
    }
    
    return ResponseUtil.success(res, result.message);
  } catch (error) {
    logger.error(`修改密码错误: ${error.message}`);
    return ResponseUtil.serverError(res, '修改密码时发生错误', error);
  }
};

/**
 * 发送密码重置邮件
 * @route POST /api/auth/password/reset
 * @access 公开
 */
const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await authService.sendPasswordResetEmail(email);
    
    if (!result.success) {
      return ResponseUtil.customResponse(res, result.status, result.message);
    }
    
    return ResponseUtil.success(res, result.message);
  } catch (error) {
    logger.error(`发送密码重置邮件错误: ${error.message}`);
    return ResponseUtil.serverError(res, '发送重置邮件时发生错误', error);
  }
};

/**
 * 重置密码
 * @route PUT /api/auth/password/reset/:token
 * @access 公开
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const result = await authService.resetPassword(token, password);
    
    if (!result.success) {
      return ResponseUtil.customResponse(res, result.status, result.message);
    }
    
    return ResponseUtil.success(res, result.message);
  } catch (error) {
    logger.error(`重置密码错误: ${error.message}`);
    return ResponseUtil.serverError(res, '重置密码时发生错误', error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
  sendPasswordResetEmail,
  resetPassword
}; 