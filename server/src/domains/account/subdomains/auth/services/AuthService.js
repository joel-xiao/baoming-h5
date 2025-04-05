const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const appConfig = require('../../../../../config/app');
const modelFactory = require('../../../../../infrastructure/database/connectors/ModelFactory');
const Admin = require('../../../models/Admin').default;
const { ADMIN_STATUS } = require('../../../models/Admin');
const logger = require('../../../../../infrastructure/utils/helper/Logger');
const { sendEmail } = require('../../../../../infrastructure/communication/email/EmailService');

/**
 * 认证服务类
 * 处理用户认证、登录、令牌管理等功能
 */
class AuthService {
  /**
   * 生成JWT令牌
   * @param {Object} user 用户对象
   * @returns {Object} 包含访问令牌和刷新令牌的对象
   */
  generateTokens(user) {
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
  }

  /**
   * 管理员登录
   * @param {string} username 用户名
   * @param {string} password 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password) {
    try {
      // 获取Admin模型
      const adminModel = modelFactory.getModel('Admin', 'account');
      
      // 查找用户
      const admin = await adminModel.findOne({ username });
      
      // 检查用户是否存在
      if (!admin) {
        logger.warn(`用户名不存在: ${username}`);
        return {
          success: false,
          status: 401,
          message: '用户名或密码错误'
        };
      }
      
      // 检查用户状态
      if (admin.status === ADMIN_STATUS.DISABLED) {
        logger.warn(`禁用账户尝试登录: ${username}`);
        return {
          success: false,
          status: 403,
          message: '账号已被禁用，请联系管理员'
        };
      }
      
      // 验证密码
      const isMatch = await bcrypt.compare(password, admin.password);
      
      if (!isMatch) {
        logger.warn(`密码错误的登录尝试: ${username}`);
        return {
          success: false,
          status: 401,
          message: '用户名或密码错误'
        };
      }
      
      // 生成JWT令牌
      const tokens = this.generateTokens(admin);
      
      // 更新最后登录时间
      admin.lastLogin = new Date();
      await admin.save();
      
      logger.info(`管理员登录成功: ${username}`);
      
      // 返回结果
      return {
        success: true,
        data: {
          ...tokens,
          user: {
            id: admin._id,
            username: admin.username,
            name: admin.name,
            role: admin.role,
            lastLogin: admin.lastLogin
          }
        },
        message: '登录成功'
      };
    } catch (error) {
      logger.error(`登录服务错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '登录服务发生错误'
      };
    }
  }

  /**
   * 刷新令牌
   * @param {string} refreshToken 刷新令牌
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      return {
        success: false,
        status: 400,
        message: '缺少刷新令牌'
      };
    }
    
    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, appConfig.jwt.refreshSecret);
      
      // 获取Admin模型
      const adminModel = modelFactory.getModel('Admin', 'account');
      
      // 查找用户
      const admin = await adminModel.findById(decoded.id);
      
      if (!admin || admin.status === ADMIN_STATUS.DISABLED) {
        return {
          success: false,
          status: 401,
          message: '无效的刷新令牌'
        };
      }
      
      // 生成新的令牌
      const tokens = this.generateTokens(admin);
      
      return {
        success: true,
        data: tokens,
        message: '令牌刷新成功'
      };
    } catch (error) {
      logger.error(`刷新令牌错误: ${error.message}`);
      
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          status: 401,
          message: '刷新令牌已过期，请重新登录'
        };
      }
      
      return {
        success: false,
        status: 401,
        message: '无效的刷新令牌'
      };
    }
  }

  /**
   * 获取当前用户信息
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getCurrentUser(userId) {
    try {
      // 获取Admin模型
      const adminModel = modelFactory.getModel('Admin', 'account');
      
      // 查找用户
      const user = await adminModel.findById(userId).select('-password');
      
      if (!user) {
        return {
          success: false,
          status: 404,
          message: '用户不存在'
        };
      }
      
      return {
        success: true,
        data: user,
        message: '获取用户信息成功'
      };
    } catch (error) {
      logger.error(`获取用户信息错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '获取用户信息时发生错误',
        error
      };
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
      // 获取Admin模型
      const adminModel = modelFactory.getModel('Admin', 'account');
      
      // 查找用户
      const admin = await adminModel.findById(userId);
      
      // 验证当前密码
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      
      if (!isMatch) {
        return {
          success: false,
          status: 400,
          message: '当前密码错误'
        };
      }
      
      // 哈希新密码
      const salt = await bcrypt.genSalt(parseInt(appConfig.security.bcryptRounds));
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // 更新密码
      admin.password = hashedPassword;
      admin.passwordChangedAt = new Date();
      await admin.save();
      
      logger.info(`管理员修改密码成功: ${admin.username}`);
      
      return {
        success: true,
        message: '密码修改成功'
      };
    } catch (error) {
      logger.error(`修改密码错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '修改密码时发生错误',
        error
      };
    }
  }

  /**
   * 发送密码重置邮件
   * @param {string} email 邮箱
   * @returns {Promise<Object>} 发送结果
   */
  async sendPasswordResetEmail(email) {
    try {
      // 获取Admin模型
      const adminModel = modelFactory.getModel('Admin', 'account');
      
      //
      // 查找用户
      const admin = await adminModel.findOne({ email });
      
      // 即使用户不存在，我们也返回成功以防止枚举攻击
      if (!admin) {
        logger.warn(`尝试为不存在的邮箱重置密码: ${email}`);
        return {
          success: true,
          message: '如果该邮箱存在，重置链接将发送到邮箱'
        };
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
      
      return {
        success: true,
        message: '如果该邮箱存在，重置链接将发送到邮箱'
      };
    } catch (error) {
      logger.error(`发送密码重置邮件错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '发送重置邮件时发生错误',
        error
      };
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
      // 哈希令牌
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      // 获取Admin模型
      const adminModel = modelFactory.getModel('Admin', 'account');
      
      // 查找用户
      const admin = await adminModel.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!admin) {
        return {
          success: false,
          status: 400,
          message: '密码重置令牌无效或已过期'
        };
      }
      
      // 哈希新密码
      const salt = await bcrypt.genSalt(parseInt(appConfig.security.bcryptRounds));
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 更新密码
      admin.password = hashedPassword;
      admin.passwordChangedAt = new Date();
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;
      await admin.save();
      
      logger.info(`管理员重置密码成功: ${admin.username}`);
      
      return {
        success: true,
        message: '密码重置成功，请使用新密码登录'
      };
    } catch (error) {
      logger.error(`重置密码错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '重置密码时发生错误',
        error
      };
    }
  }
}

// 创建并导出单例
const authService = new AuthService();
module.exports = authService; 