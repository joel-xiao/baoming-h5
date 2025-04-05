const express = require('express');
const RouteLoader = require('../utils/helper/RouteLoader');
const logger = require('../utils/helper/Logger');

/**
 * API文档中间件 - 生成并显示系统所有API路由
 * @param {Object} options 配置选项
 * @returns {Function} Express中间件
 */
const apiDocsMiddleware = (options = {}) => {
  const router = express.Router();
  const {
    path = '/api-docs',
    enabled = process.env.NODE_ENV === 'development'
  } = options;
  
  // 只在启用时注册路由
  if (enabled) {
    router.get(path, (req, res) => {
      try {
        const routes = RouteLoader.getAllRoutes(req.app);
        
        // 按路径分组整理
        const routesByDomain = routes.reduce((acc, route) => {
          const domain = route.path.split('/')[2] || '根路径';
          
          if (!acc[domain]) {
            acc[domain] = [];
          }
          
          acc[domain].push({
            path: route.path,
            methods: route.methods,
          });
          
          return acc;
        }, {});
        
        res.render('api-docs', {
          title: 'API文档',
          domains: Object.keys(routesByDomain),
          routesByDomain,
          totalCount: routes.length
        });
      } catch (error) {
        logger.error(`生成API文档失败: ${error.message}`);
        res.status(500).json({
          success: false,
          message: '生成API文档失败',
          error: error.message
        });
      }
    });
  }
  
  return router;
};

module.exports = apiDocsMiddleware; 