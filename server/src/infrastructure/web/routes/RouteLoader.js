const fs = require('fs');
const path = require('path');

/**
 * 路由加载器 - 负责从各领域中加载并注册路由
 */
class RouteLoader {
  /**
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
   * @param {Object} options - 路由加载选项
   * @param {string} options.domainBasePath - 域的基础路径 (必填)
   * @param {string} options.routeFileName - 路由文件名称 (默认为 'routes.js')
   */
  loadRoutes(app, options = {}) {
    this.app = app;
    this.loadFromDomains(options);
    return this;
  }

  /**
   * 从各域模块中加载并注册路由
   */
  loadFromDomains(options = {}) {
    try {
      if (!options.domainBasePath) {
        const error = new Error('必须提供domainBasePath参数');
        this.logger.error(error.message);
        throw error;
      }
      
      let domainBasePath = options.domainBasePath;
      if (!path.isAbsolute(domainBasePath)) {
        domainBasePath = path.resolve(process.cwd(), domainBasePath);
      }
      
      const routeFileName = options.routeFileName || 'routes.js';
      
      this.logger.info(`加载域路由，路径: ${domainBasePath}, 文件名: ${routeFileName}`);
      
      if (!fs.existsSync(domainBasePath)) {
        const error = new Error(`找不到域目录: ${domainBasePath}`);
        this.logger.error(error.message);
        throw error;
      }
      
      const domains = fs.readdirSync(domainBasePath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      domains.forEach(domainName => {
        this.collectDomainRoutes(domainName, domainBasePath, routeFileName);
      });

      this.app.use('/api', this.authMiddleware.bind(this));
      this.registerCollectedRoutes();
      
      this.logger.info(`共加载了 ${this.publicPaths.length} 个公共API路径`);
    } catch (error) {
      this.logger.error('加载路由出错:', error);
      throw error;
    }
  }

  /**
   * 收集指定域的路由（不注册）
   */
  collectDomainRoutes(domainName, domainBasePath, routeFileName) {
    try {
      const domainPath = path.resolve(domainBasePath, domainName);
      const routePath = path.resolve(domainPath, routeFileName);
      
      if (!fs.existsSync(domainPath)) {
        return;
      }
      
      if (!fs.existsSync(routePath)) {
        return;
      }
      
      let domainModule;
      try {
        delete require.cache[require.resolve(routePath)];
        domainModule = require(routePath);
      } catch (reqError) {
        this.logger.error(`导入 ${domainName} 域路由文件失败: ${reqError.message}`);
        throw reqError;
      }
      
      if (!domainModule || typeof domainModule !== 'object') {
        return;
      }
      
      if (domainModule.publicPaths && Array.isArray(domainModule.publicPaths)) {
        this.publicPaths = [...this.publicPaths, ...domainModule.publicPaths];
      }
      
      this.domainRoutes.push({
        domainName,
        module: domainModule
      });
      
      this.logger.info(`已收集 ${domainName} 域的路由`);
    } catch (error) {
      this.logger.error(`收集 ${domainName} 域路由出错: ${error.message}`);
      throw error;
    }
  }

  /**
   * 注册所有收集到的路由
   */
  registerCollectedRoutes() {
    if (!this.domainRoutes) return;
    
    this.domainRoutes.forEach(({ domainName, module }) => {
      if (module.router) {
        this.app.use('/api', module.router);
      }
      
      for (const routeKey in module) {
        if (routeKey !== 'router' && routeKey !== 'publicPaths' && routeKey !== 'initEventHandlers') {
          this.app.use('/api', module[routeKey]);
        }
      }
      
      if (module.initEventHandlers && typeof module.initEventHandlers === 'function') {
        module.initEventHandlers();
      }
    });
  }

  /**
   * 身份验证中间件 - 检查请求是否需要身份验证
   */
  authMiddleware(req, res, next) {
    const fullPath = `/api${req.path}`;
    const method = req.method;
    
    const isPublicPath = this.publicPaths.some(item => {
      const pathPattern = item.path
        .replace(/:[^/]+/g, '[^/]+')
        .replace(/\//g, '\\/');
        
      const pathRegex = new RegExp(`^${pathPattern}$`);
      return pathRegex.test(fullPath) && item.method === method;
    });
    
    if (isPublicPath) {
      return next();
    }
    
    const isAdminPath = req.path.includes('/admin/');
    const container = this.app.get('container');
    const AuthMiddleware = container.resolve('authMiddleware');
    
    if (isAdminPath) {
      return AuthMiddleware.authenticate(req, res, () => {
        AuthMiddleware.requireAdmin(req, res, next);
      });
    } else {
      return AuthMiddleware.authenticate(req, res, next);
    }
  }
}

module.exports = RouteLoader; 