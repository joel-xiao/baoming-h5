/**
 * 基础设施层入口
 * 导出所有基础设施组件，提供向后兼容性支持
 */

// 依赖注入容器
const container = require('./common/di/Container');

// 辅助函数，用于在 require 时注册模块
function registerAndRequire(name, path, options = { singleton: true }) {
  const Module = require(path);
  container.register(name, Module, options);
  return Module;
}

// 通用组件
registerAndRequire('logger', './common/logging/LoggerService');
registerAndRequire('cache', './common/cache/MemoryCache', { dependencies: ['logger'] });
registerAndRequire('idGenerator', './common/utils/IDGenerator');

// 数据访问组件
registerAndRequire('database', './data/connectors/DatabaseConnector', { dependencies: ['logger'] });
registerAndRequire('schemaMapper', './data/repositories/SchemaMapper', { dependencies: ['database', 'logger'] });
registerAndRequire('modelFactory', './data/connectors/ModelFactory', { dependencies: ['database', 'container'] });

// Web组件
registerAndRequire('responseFormatter', './web/response/ResponseFormatter');
registerAndRequire('routeLoader', './web/routes/RouteLoader', { dependencies: ['logger'] });
registerAndRequire('authMiddleware', './web/middlewares/auth/AuthMiddleware', { dependencies: ['responseFormatter', 'modelFactory'] });
registerAndRequire('errorHandler', './web/middlewares/handling/ErrorHandler', { dependencies: ['logger'] });
registerAndRequire('performanceMonitor', './web/middlewares/performance/PerformanceMonitor', { dependencies: ['logger'] });

// 外部服务组件
registerAndRequire('emailService', './external/messaging/email/EmailService', { dependencies: ['logger'] });

// 注册容器自身，允许将容器传递给需要的组件
container.register('container', container, { singleton: true });

// 仅导出容器
module.exports = {
  container
};
