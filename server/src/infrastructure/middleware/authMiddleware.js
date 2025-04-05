const jwt = require('jsonwebtoken');
const appConfig = require('@config/app');
const { ResponseUtil } = require('@utils/helper/ResponseUtil');
const ModelFactory = require('@database/connectors/ModelFactory');
const Admin = require('@domains/account/models/Admin');
const { ADMIN_ROLE } = Admin;

/**
 * 验证JWT令牌的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从Authorization头获取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseUtil.unauthorized(res, '未提供授权令牌');
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const decoded = jwt.verify(token, appConfig.jwt.secret);
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const user = await adminModel.findById(decoded.id);
    
    if (!user) {
      return ResponseUtil.unauthorized(res, '无效的授权令牌');
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseUtil.unauthorized(res, '令牌已过期');
    }
    
    return ResponseUtil.unauthorized(res, '无效的授权令牌');
  }
};

/**
 * 验证管理员权限的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return ResponseUtil.unauthorized(res, '请先登录');
  }
  
  // 检查用户角色
  if (req.user.role !== ADMIN_ROLE.SUPER_ADMIN && req.user.role !== ADMIN_ROLE.ADMIN) {
    return ResponseUtil.forbidden(res, '您没有管理员权限');
  }
  
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
}; 