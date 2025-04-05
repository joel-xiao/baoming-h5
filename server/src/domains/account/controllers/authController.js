const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const appConfig = require('@config/app');
const container = require('@common/di/Container');
const ModelFactory = require('@connectors/ModelFactory');
const Admin = require('../models/Admin');
const { ADMIN_ROLE, ADMIN_STATUS } = Admin;

// 一次性解析常用依赖
const logger = container.resolve('logger');
const responseFormatter = container.resolve('responseFormatter');
const emailService = container.resolve('emailService');

/**
 * 生成JWT令牌
 * @param {Object} user 用户对象
 * @returns {Object} 包含访问令牌和刷新令牌的对象
 */
const generateTokens = (user) => {
  // 创建访问令牌
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    appConfig.jwt.secret,
    { expiresIn: appConfig.jwt.expiresIn }
  );
  
  // 创建刷新令牌
  const refreshToken = jwt.sign(
    { id: user._id },
    appConfig.jwt.refreshSecret,
    { expiresIn: appConfig.jwt.refreshExpiresIn }
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: parseInt(appConfig.jwt.expiresIn)
  };
};

/**
 * 管理员登录
 * @route POST /api/auth/login
 * @access 公开
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const admin = await adminModel.findOne({ username });
    
    // 检查用户是否存在
    if (!admin) {
      return responseFormatter.unauthorized(res, '用户名或密码错误');
    }
    
    // 检查用户状态
    if (admin.status === ADMIN_STATUS.DISABLED) {
      logger.warn(`禁用账户尝试登录: ${username}`);
      return responseFormatter.forbidden(res, '账号已被禁用，请联系管理员');
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      logger.warn(`密码错误的登录尝试: ${username}`);
      return responseFormatter.unauthorized(res, '用户名或密码错误');
    }
    
    // 生成JWT令牌
    const tokens = generateTokens(admin);
    
    // 更新最后登录时间
    admin.lastLogin = new Date();
    await admin.save();
    
    logger.info(`管理员登录成功: ${username}`);
    
    // 返回令牌
    return responseFormatter.success(res, {
      ...tokens,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    }, '登录成功');
  } catch (error) {
    logger.error(`登录错误: ${error.message}`);
    return responseFormatter.error(res, '登录过程中发生错误');
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
    
    if (!refreshToken) {
      return responseFormatter.badRequest(res, '缺少刷新令牌');
    }
    
    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, appConfig.jwt.refreshSecret);
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const admin = await adminModel.findById(decoded.id);
    
    if (!admin || admin.status === ADMIN_STATUS.DISABLED) {
      return responseFormatter.unauthorized(res, '无效的刷新令牌');
    }
    
    // 生成新的令牌
    const tokens = generateTokens(admin);
    
    return responseFormatter.success(res, tokens, '令牌刷新成功');
  } catch (error) {
    logger.error(`刷新令牌错误: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return responseFormatter.unauthorized(res, '刷新令牌已过期，请重新登录');
    }
    
    return responseFormatter.unauthorized(res, '无效的刷新令牌');
  }
};

/**
 * 退出登录
 * @route POST /api/auth/logout
 * @access 私有
 */
const logout = async (req, res) => {
  try {
    // 这里我们不做任何令牌黑名单操作，因为JWT是无状态的
    // 客户端应删除令牌
    
    return responseFormatter.success(res, null, '成功退出登录');
  } catch (error) {
    logger.error(`退出登录错误: ${error.message}`);
    return responseFormatter.error(res, '退出过程中发生错误');
  }
};

/**
 * 获取当前用户信息
 * @route GET /api/auth/me
 * @access 私有
 */
const getCurrentUser = async (req, res) => {
  try {
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 刷新用户信息
    const user = await adminModel.findById(req.user._id).select('-password');
    
    if (!user) {
      return responseFormatter.notFound(res, '用户不存在');
    }
    
    return responseFormatter.success(res, user, '获取用户信息成功');
  } catch (error) {
    logger.error(`获取用户信息错误: ${error.message}`);
    return responseFormatter.error(res, '获取用户信息时发生错误');
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
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const admin = await adminModel.findById(req.user._id);
    
    // 验证当前密码
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isMatch) {
      return responseFormatter.badRequest(res, '当前密码错误');
    }
    
    // 哈希新密码
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.passwordChangedAt = new Date();
    
    await admin.save();
    
    logger.info(`用户${admin.username}已修改密码`);
    
    return responseFormatter.success(res, null, '密码修改成功');
  } catch (error) {
    logger.error(`修改密码错误: ${error.message}`);
    return responseFormatter.error(res, '修改密码时发生错误');
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
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const admin = await adminModel.findOne({ email });
    
    // 不管用户是否存在，都返回相同的响应，避免泄露用户信息
    if (!admin) {
      logger.info(`尝试重置不存在的邮箱密码: ${email}`);
      // 为了安全，我们仍然返回成功，但不发送邮件
      return responseFormatter.success(res, null, '如果该邮箱存在，重置链接将发送到邮箱');
    }
    
    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 哈希令牌并保存
    admin.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    admin.resetPasswordExpire = Date.now() + 3600000; // 1小时后过期
    await admin.save();
    
    // 构建重置URL
    const resetUrl = `${appConfig.clientUrl}/reset-password/${resetToken}`;
    
    try {
      // 发送重置邮件
      await emailService.sendEmail({
        to: admin.email,
        subject: '密码重置',
        text: `您请求重置密码，请点击以下链接重置密码：${resetUrl}。该链接将在1小时后过期。`,
        html: `
          <p>您好，</p>
          <p>您请求重置密码，请点击以下链接重置密码：</p>
          <p><a href="${resetUrl}" target="_blank">重置密码</a></p>
          <p>该链接将在1小时后过期。</p>
          <p>如果您没有请求重置密码，请忽略此邮件。</p>
        `
      });
      
      logger.info(`已发送密码重置邮件到: ${email}`);
    } catch (emailError) {
      logger.error(`发送重置邮件失败: ${emailError.message}`);
      
      // 清除重置令牌和过期时间
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpire = undefined;
      await admin.save();
      
      throw new Error('发送重置邮件失败');
    }
    
    return responseFormatter.success(res, null, '如果该邮箱存在，重置链接将发送到邮箱');
  } catch (error) {
    logger.error(`发送重置邮件错误: ${error.message}`);
    return responseFormatter.error(res, '发送重置邮件时发生错误');
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
    
    // 哈希令牌
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const admin = await adminModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!admin) {
      return responseFormatter.badRequest(res, '密码重置令牌无效或已过期');
    }
    
    // 哈希新密码
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    
    // 清除重置字段
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    admin.passwordChangedAt = new Date();
    
    await admin.save();
    
    logger.info(`用户${admin.username}已重置密码`);
    
    return responseFormatter.success(res, null, '密码重置成功，请使用新密码登录');
  } catch (error) {
    logger.error(`重置密码错误: ${error.message}`);
    return responseFormatter.error(res, '重置密码时发生错误');
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