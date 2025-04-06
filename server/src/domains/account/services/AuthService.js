const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const appConfig = require('@config/app');
const BaseService = require('../../BaseService');
const container = require('@common/di/Container');
// 只导入常量，不导入模型
const { ADMIN_ROLE, ADMIN_STATUS } = require('../models/Admin');

/**
 * 认证服务类
 * 处理用户认证、登录、密码管理等功能
 */
class AuthService extends BaseService {
  /**
   * 初始化认证服务
   */
  init() {
    this.modelFactory = container.resolve('modelFactory');
    this.adminRepo = this.modelFactory.getRepository('Admin', 'account');
    this.adminModel = this.adminRepo.model; // 保留对模型的引用以兼容现有代码
  }

  /**
   * 获取数据访问对象
   * @returns {Object} 数据访问对象
   */
  getDataAccess() {
    return this.adminRepo;
  }

  /**
   * 生成JWT令牌
   * @param {Object} user 用户对象
   * @returns {Object} 包含访问令牌的对象
   */
  generateToken(user) {
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn }
    );
    
    return {
      accessToken,
      expiresIn: parseInt(appConfig.jwt.expiresIn)
    };
  }

  /**
   * 管理员登录
   * @param {string} username 用户名
   * @param {string} password 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password) {
    try {
      // 查找用户
      const admin = await this.adminModel.findOne({ username });
      
      // 检查用户是否存在
      if (!admin) {
        this.logWarn(`用户名不存在: ${username}`);
        return this.responseFormatter.errorResponse(401, '用户名或密码错误');
      }
      
      // 检查用户状态
      if (admin.status === ADMIN_STATUS.INACTIVE) {
        this.logWarn(`禁用账户尝试登录: ${username}`);
        return this.responseFormatter.errorResponse(403, '账号已被禁用，请联系管理员');
      }
      
      // 验证密码
      const isMatch = await bcrypt.compare(password, admin.password);
      
      if (!isMatch) {
        this.logWarn(`密码错误的登录尝试: ${username}`);
        return this.responseFormatter.errorResponse(401, '用户名或密码错误');
      }
      
      // 生成JWT令牌
      const token = this.generateToken(admin);
      
      // 更新最后登录时间
      admin.lastLoginAt = new Date();
      await admin.save();
      
      this.logInfo(`管理员登录成功: ${username}`);
      
      // 返回结果
      return this.responseFormatter.successResponse(200, {
        ...token,
        user: {
          id: admin._id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          lastLogin: admin.lastLoginAt
        }
      }, '登录成功');
    } catch (error) {
      this.logError(`登录服务错误: ${error.message}`, error);
      return this.responseFormatter.errorResponse(500, '登录服务发生错误');
    }
  }

  /**
   * 获取当前用户信息
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getCurrentUser(userId) {
    try {
      const user = await this.adminModel.findById(userId).select('-password');
      
      if (!user) {
        return this.responseFormatter.errorResponse(404, '用户不存在');
      }
      
      return this.responseFormatter.successResponse(200, user, '获取用户信息成功');
    } catch (error) {
      this.logError(`获取用户信息错误: ${error.message}`, error);
      return this.responseFormatter.errorResponse(500, '获取用户信息时发生错误');
    }
  }

  /**
   * 修改密码
   * @param {string} userId 用户ID
   * @param {string} currentPassword 当前密码
   * @param {string} newPassword 新密码
   * @returns {Promise<Object>} 修改结果
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // 查找用户
      const admin = await this.adminModel.findById(userId);
      
      // 验证当前密码
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      
      if (!isMatch) {
        return this.responseFormatter.errorResponse(400, '当前密码不正确');
      }
      
      // 加密新密码
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
      
      // 保存更新
      await admin.save();
      
      this.logInfo(`管理员密码修改成功: ${admin.username}`);
      return this.responseFormatter.successResponse(200, null, '密码修改成功');
    } catch (error) {
      this.logError(`修改密码错误: ${error.message}`, error);
      return this.responseFormatter.errorResponse(500, '修改密码时发生错误');
    }
  }

  /**
   * 发送密码重置邮件
   * @param {string} email 邮箱
   * @returns {Promise<Object>} 发送结果
   */
  async sendPasswordResetEmail(email) {
    try {
      // 查找用户
      const admin = await this.adminModel.findOne({ email });
      
      // 不管用户是否存在，都返回相同的响应，避免泄露用户信息
      if (!admin) {
        this.logInfo(`尝试重置不存在的邮箱密码: ${email}`);
        return this.responseFormatter.successResponse(200, null, '如果该邮箱存在，重置链接将发送到邮箱');
      }
      
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      admin.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      admin.passwordResetExpires = Date.now() + 3600000; // 1小时后过期
      await admin.save();
      
      const resetUrl = `${appConfig.clientUrl}/reset-password/${resetToken}`;
      
      try {
        await this.sendEmail({
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
        
        this.logInfo(`已发送密码重置邮件到: ${email}`);
      } catch (emailError) {
        this.logError(`发送重置邮件失败: ${emailError.message}`, emailError);
        
        admin.passwordResetToken = undefined;
        admin.passwordResetExpires = undefined;
        await admin.save();
        
        return this.responseFormatter.errorResponse(500, '发送重置邮件失败');
      }
      
      return this.responseFormatter.successResponse(200, null, '如果该邮箱存在，重置链接将发送到邮箱');
    } catch (error) {
      this.logError(`发送重置邮件错误: ${error.message}`, error);
      return this.responseFormatter.errorResponse(500, '发送重置邮件时发生错误');
    }
  }

  /**
   * 重置密码
   * @param {string} token 重置令牌
   * @param {string} password 新密码
   * @returns {Promise<Object>} 重置结果
   */
  async resetPassword(token, password) {
    try {
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      const admin = await this.adminModel.findOne({
        passwordResetToken: resetPasswordToken,
        passwordResetExpires: { $gt: Date.now() }
      });
      
      if (!admin) {
        return this.responseFormatter.errorResponse(400, '密码重置令牌无效或已过期');
      }
      
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
      
      admin.passwordResetToken = undefined;
      admin.passwordResetExpires = undefined;
      
      await admin.save();
      
      this.logInfo(`用户${admin.username}已重置密码`);
      
      return this.responseFormatter.successResponse(200, null, '密码重置成功，请使用新密码登录');
    } catch (error) {
      this.logError(`重置密码错误: ${error.message}`, error);
      return this.responseFormatter.errorResponse(500, '重置密码时发生错误');
    }
  }
}

// 创建单例实例
const authService = new AuthService();

// 导出服务实例
module.exports = authService;