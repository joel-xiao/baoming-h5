const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const appConfig = require('../../config/app');
const ModelFactory = require('../../core/db/ModelFactory');
const Admin = require('../../core/models/Admin');
const { ADMIN_ROLE, ADMIN_STATUS } = require('../../core/constants');
const logger = require('../../core/utils/Logger');
const { ResponseUtil } = require('../../core/utils/ResponseUtil');
const { sendEmail } = require('../../core/utils/EmailService');

/**
 * 生成JWT令牌
 * @param {Object} user 用户对象
 * @returns {Object} 包含访问令牌和刷新令牌的对象
 */
const generateTokens = (user) => {
  // 创建访问令牌
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    appConfig.security.jwt.secret,
    { expiresIn: appConfig.security.jwt.expiresIn }
  );
  
  // 创建刷新令牌
  const refreshToken = jwt.sign(
    { id: user._id },
    appConfig.security.jwt.refreshSecret,
    { expiresIn: appConfig.security.jwt.refreshExpiresIn }
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: parseInt(appConfig.security.jwt.expiresIn)
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
      return ResponseUtil.unauthorized(res, '用户名或密码错误');
    }
    
    // 检查用户状态
    if (admin.status === ADMIN_STATUS.DISABLED) {
      logger.warn(`禁用账户尝试登录: ${username}`);
      return ResponseUtil.forbidden(res, '账号已被禁用，请联系管理员');
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      logger.warn(`密码错误的登录尝试: ${username}`);
      return ResponseUtil.unauthorized(res, '用户名或密码错误');
    }
    
    // 生成JWT令牌
    const tokens = generateTokens(admin);
    
    // 更新最后登录时间
    admin.lastLogin = new Date();
    await admin.save();
    
    logger.info(`管理员登录成功: ${username}`);
    
    // 返回令牌
    return ResponseUtil.success(res, '登录成功', {
      ...tokens,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
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
    
    if (!refreshToken) {
      return ResponseUtil.badRequest(res, '缺少刷新令牌');
    }
    
    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, appConfig.security.jwt.refreshSecret);
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const admin = await adminModel.findById(decoded.id);
    
    if (!admin || admin.status === ADMIN_STATUS.DISABLED) {
      return ResponseUtil.unauthorized(res, '无效的刷新令牌');
    }
    
    // 生成新的令牌
    const tokens = generateTokens(admin);
    
    return ResponseUtil.success(res, '令牌刷新成功', tokens);
  } catch (error) {
    logger.error(`刷新令牌错误: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return ResponseUtil.unauthorized(res, '刷新令牌已过期，请重新登录');
    }
    
    return ResponseUtil.unauthorized(res, '无效的刷新令牌');
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
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 刷新用户信息
    const user = await adminModel.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '获取用户信息成功',
      data: user
    });
  } catch (error) {
    logger.error(`获取用户信息错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取用户信息时发生错误'
    });
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
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 哈希新密码
    const salt = await bcrypt.genSalt(parseInt(appConfig.security.bcrypt.rounds));
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 更新密码
    admin.password = hashedPassword;
    admin.passwordChangedAt = new Date();
    await admin.save();
    
    logger.info(`管理员修改密码成功: ${admin.username}`);
    
    res.status(200).json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    logger.error(`修改密码错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '修改密码时发生错误'
    });
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
    
    // 即使用户不存在，我们也返回成功以防止枚举攻击
    if (!admin) {
      logger.warn(`尝试为不存在的邮箱重置密码: ${email}`);
      return res.status(200).json({
        success: true,
        message: '如果该邮箱存在，重置链接将发送到邮箱'
      });
    }
    
    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1小时后过期
    
    // 哈希令牌
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // 保存哈希令牌到数据库
    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = resetTokenExpiry;
    await admin.save();
    
    // 构建重置链接
    const resetUrl = `${appConfig.frontend.url}/reset-password/${resetToken}`;
    
    // 发送邮件
    await sendEmail({
      to: admin.email,
      subject: '【团队报名系统】密码重置',
      text: `您收到此邮件是因为您（或其他人）请求重置密码。请点击以下链接重置密码，链接1小时内有效：\n\n${resetUrl}\n\n如果您没有请求重置密码，请忽略此邮件，您的密码将保持不变。`,
      html: `
        <p>您好，</p>
        <p>您收到此邮件是因为您（或其他人）请求重置密码。</p>
        <p>请点击以下链接重置密码，链接1小时内有效：</p>
        <a href="${resetUrl}" target="_blank">重置密码</a>
        <p>如果您没有请求重置密码，请忽略此邮件，您的密码将保持不变。</p>
        <p>谢谢！</p>
        <p>团队报名系统</p>
      `
    });
    
    logger.info(`密码重置邮件已发送: ${email}`);
    
    res.status(200).json({
      success: true,
      message: '如果该邮箱存在，重置链接将发送到邮箱'
    });
  } catch (error) {
    logger.error(`发送密码重置邮件错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '发送重置邮件时发生错误'
    });
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
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const admin = await adminModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: '密码重置令牌无效或已过期'
      });
    }
    
    // 哈希新密码
    const salt = await bcrypt.genSalt(parseInt(appConfig.security.bcrypt.rounds));
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 更新密码
    admin.password = hashedPassword;
    admin.passwordChangedAt = new Date();
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();
    
    logger.info(`管理员重置密码成功: ${admin.username}`);
    
    res.status(200).json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    });
  } catch (error) {
    logger.error(`重置密码错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '重置密码时发生错误'
    });
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