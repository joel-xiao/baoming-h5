const jwt = require('jsonwebtoken');
const appConfig = require('@config/app');
// 只导入常量
const { ADMIN_ROLE } = require('@domains/account/models/Admin');

/**
 * 身份验证中间件类
 */
class AuthMiddleware {
  /**
   * 构造函数
   * @param {Object} responseFormatter - 响应格式化工具
   * @param {Object} modelFactory - 模型工厂实例
   */
  constructor(responseFormatter, modelFactory) {
    this.responseFormatter = responseFormatter;
    this.modelFactory = modelFactory;
  }

  /**
   * 验证JWT令牌的中间件
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async authenticate(req, res, next) {
    try {
      // 从Authorization头获取令牌
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return this.responseFormatter.unauthorized(res, '未提供授权令牌');
      }
      
      const token = authHeader.split(' ')[1];
      
      // 验证令牌
      const decoded = jwt.verify(token, appConfig.jwt.secret);
      
      // 获取Admin模型 - 使用字符串参数
      const adminModel = this.modelFactory.getModel('Admin', 'account');
      
      // 查找用户
      const user = await adminModel.findById(decoded.id);
      
      if (!user) {
        return this.responseFormatter.unauthorized(res, '无效的授权令牌');
      }
      
      // 将用户信息添加到请求对象
      req.user = user;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return this.responseFormatter.unauthorized(res, '令牌已过期');
      }
      
      return this.responseFormatter.unauthorized(res, '无效的授权令牌');
    }
  }

  /**
   * 验证管理员权限的中间件
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  requireAdmin(req, res, next) {
    if (!req.user) {
      return this.responseFormatter.unauthorized(res, '请先登录');
    }
    
    // 检查用户角色 - 简化后只需要检查ADMIN角色
    if (req.user.role !== ADMIN_ROLE.ADMIN) {
      return this.responseFormatter.forbidden(res, '您没有管理员权限');
    }
    
    next();
  }
  
  // 为了兼容静态方法调用，提供静态方法包装器
  static authenticate(req, res, next) {
    const container = req.app.get('container');
    const authMiddleware = container.resolve('authMiddleware');
    return authMiddleware.authenticate(req, res, next);
  }
  
  static requireAdmin(req, res, next) {
    const container = req.app.get('container');
    const authMiddleware = container.resolve('authMiddleware');
    return authMiddleware.requireAdmin(req, res, next);
  }
}

module.exports = AuthMiddleware;
