const jwt = require('jsonwebtoken');
const appConfig = require('../../config/app');
const ModelFactory = require('../../core/db/ModelFactory');
const Admin = require('../../core/models/Admin');
const logger = require('../../core/utils/Logger');

/**
 * 认证中间件
 * 验证请求头中的 JWT 令牌
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 获取请求头中的authorization字段
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    // 令牌格式为 "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: '认证令牌格式错误'
      });
    }
    
    const token = parts[1];
    
    // 验证令牌
    const decoded = jwt.verify(token, appConfig.security.jwt.secret);
    
    // 从数据库中获取用户信息
    const adminModel = ModelFactory.getModel(Admin);
    const admin = await adminModel.findOne({ _id: decoded.id });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }
    
    // 检查用户状态
    if (admin.status === '禁用') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }
    
    // 将用户信息添加到请求对象中
    req.user = admin;
    
    next();
  } catch (error) {
    logger.error(`身份验证失败: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期',
        expired: true
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    });
  }
};

/**
 * 管理员权限中间件
 * 验证用户是否有管理员权限
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // authMiddleware 已经将用户信息添加到请求对象中
    const user = req.user;
    
    // 检查用户是否是管理员
    const isAdmin = ['超级管理员', '管理员'].includes(user.role);
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: '没有足够的权限执行此操作'
      });
    }
    
    next();
  } catch (error) {
    logger.error(`管理员权限验证失败: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      message: '权限验证时发生错误'
    });
  }
};

/**
 * 超级管理员权限中间件
 * 验证用户是否有超级管理员权限
 */
const superAdminMiddleware = async (req, res, next) => {
  try {
    // authMiddleware 已经将用户信息添加到请求对象中
    const user = req.user;
    
    // 检查用户是否是超级管理员
    if (user.role !== '超级管理员') {
      return res.status(403).json({
        success: false,
        message: '需要超级管理员权限'
      });
    }
    
    next();
  } catch (error) {
    logger.error(`超级管理员权限验证失败: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      message: '权限验证时发生错误'
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  superAdminMiddleware
}; 