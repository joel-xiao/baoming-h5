const fs = require('fs');
const path = require('path');

/**
 * 路由加载器
 * 负责从各个领域中加载并注册路由
 */
class RouteLoader {
  /**
   * 创建路由加载器
   * @param {Object} logger - 日志服务实例
   */
  constructor(logger) {
    this.logger = logger;
    this.publicPaths = [];
    this.domainRoutes = [];
  }

  /**
   * 加载并注册所有路由
   * @param {Object} app - Express应用实例
   */
  loadRoutes(app) {
    this.app = app;
    this.loadFromDomains();
    return this;
  }

  /**
   * 从各个域模块中加载并注册路由
   */
  loadFromDomains() {
    try {
      this.logger.info('开始加载域路由...');
      
      // 获取domains目录路径
      const domainsDir = path.join(__dirname, '../../../domains');
      
      // 读取domains目录下的所有文件夹（每个文件夹代表一个域）
      const domains = fs.readdirSync(domainsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      // 遍历每个域并收集公共路径及路由
      domains.forEach(domainName => {
        this.collectDomainRoutes(domainName);
      });

      // 注册身份验证中间件（只注册一次）
      this.app.use('/api', this.authMiddleware.bind(this));
      
      // 注册收集到的所有路由
      this.registerCollectedRoutes();
      
      this.logger.info(`共加载了 ${this.publicPaths.length} 个公共API路径`);
    } catch (error) {
      this.logger.error('加载路由时出错:', error);
      throw error;
    }
  }

  /**
   * 收集指定域的路由（不注册）
   * @param {string} domainName - 域名称
   */
  collectDomainRoutes(domainName) {
    try {
      // 导入域路由模块
      const domainModule = require(`@domains/${domainName}/routes`);
      
      // 收集公共路径
      if (domainModule.publicPaths) {
        this.publicPaths = [...this.publicPaths, ...domainModule.publicPaths];
      }
      
      this.domainRoutes.push({
        domainName,
        module: domainModule
      });
      
      this.logger.info(`已收集 ${domainName} 域的路由`);
    } catch (error) {
      this.logger.error(`收集 ${domainName} 域路由时出错:`, error);
      throw error;
    }
  }

  /**
   * 注册所有收集到的路由
   */
  registerCollectedRoutes() {
    if (!this.domainRoutes) return;
    
    this.domainRoutes.forEach(({ domainName, module }) => {
      // 注册各种路由
      if (module.router) {
        this.app.use('/api', module.router);
        this.logger.info(`已注册 ${domainName} 域的路由`);
      }
      
      // 注册子路由组
      for (const routeKey in module) {
        if (routeKey !== 'router' && routeKey !== 'publicPaths' && routeKey !== 'initEventHandlers') {
          this.app.use('/api', module[routeKey]);
          this.logger.info(`已注册 ${domainName} 域的 ${routeKey}`);
        }
      }
      
      // 初始化事件处理器（如果存在）
      if (module.initEventHandlers && typeof module.initEventHandlers === 'function') {
        module.initEventHandlers();
        this.logger.info(`已初始化 ${domainName} 域的事件处理器`);
      }
    });
  }

  /**
   * 身份验证中间件
   * 检查请求是否为公共路径，如果不是则应用身份验证
   */
  authMiddleware(req, res, next) {
    const fullPath = `/api${req.path}`;
    const method = req.method;
    
    // 检查是否为公共路径
    const isPublicPath = this.publicPaths.some(item => {
      // 处理带参数的路径（将路径模式转换为正则表达式）
      const pathPattern = item.path
        .replace(/:[^/]+/g, '[^/]+') // 将 :param 替换为 [^/]+ 正则
        .replace(/\//g, '\\/'); // 转义斜杠
        
      const pathRegex = new RegExp(`^${pathPattern}$`);
      return pathRegex.test(fullPath) && item.method === method;
    });
    
    if (isPublicPath) {
      return next();
    }
    
    // 检查是否为管理员API
    const isAdminPath = req.path.includes('/admin/');
    
    // 通过依赖注入容器获取身份验证中间件
    const container = this.app.get('container');
    const AuthMiddleware = container.resolve('authMiddleware');
    
    if (isAdminPath) {
      // 管理员路由需要管理员权限和身份验证
      return AuthMiddleware.authenticate(req, res, () => {
        AuthMiddleware.requireAdmin(req, res, next);
      });
    } else {
      // 普通路由只需要基本身份验证
      return AuthMiddleware.authenticate(req, res, next);
    }
  }
}

module.exports = RouteLoader; 