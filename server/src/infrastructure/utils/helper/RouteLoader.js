const fs = require('fs');
const path = require('path');
const logger = require('./Logger');

/**
 * 路由加载器 - 仅负责引入所有领域路由
 */
class RouteLoader {
  /**
   * 加载所有领域路由
   * @param {Express} app Express应用实例
   * @param {String} basePath 领域目录路径
   * @param {String} basePrefix API全局前缀
   */
  static loadDomainRoutes(app, basePath = path.join(process.cwd(), 'src/domains'), basePrefix = '/api') {
    try {
      // 获取所有领域目录
      const domains = fs.readdirSync(basePath).filter(
        file => fs.statSync(path.join(basePath, file)).isDirectory()
      );
      
      // 遍历所有领域
      domains.forEach(domain => {
        const routePath = path.join(basePath, domain, 'routes.js');
        
        // 检查路由文件是否存在并加载
        if (fs.existsSync(routePath)) {
          try {
            const routes = require(routePath);
            
            // 注册路由
            if (typeof routes === 'object' && routes.router) {
              app.use(basePrefix, routes.router);
              
              // 支付领域事件处理器
              if (routes.initEventHandlers) {
                routes.initEventHandlers(app);
              }
            } else if (typeof routes === 'object' && routes.authRoutes && routes.adminRoutes) {
              app.use(basePrefix, routes.authRoutes);
              app.use(basePrefix, routes.adminRoutes);
            } else {
              app.use(basePrefix, routes);
            }
          } catch (error) {
            logger.error(`加载${domain}领域路由失败: ${error.message}`);
          }
        }
      });
    } catch (error) {
      logger.error(`加载领域路由失败: ${error.message}`);
    }
  }
}

module.exports = RouteLoader; 