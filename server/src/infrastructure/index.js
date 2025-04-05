/**
 * 基础设施层入口
 * 导出所有基础设施组件，提供向后兼容性支持
 */

// 依赖注入容器
const container = require('./common/di/Container');

// 通用组件
const LoggerService = require('./common/logging/LoggerService');
const MemoryCache = require('./common/cache/MemoryCache');
const IDGenerator = require('./common/utils/IDGenerator');

// 数据访问组件
const DatabaseConnector = require('./data/connectors/DatabaseConnector');
const BaseRepository = require('./data/repositories/BaseRepository');
const SchemaMapper = require('./data/repositories/SchemaMapper');
const ModelFactory = require('./data/connectors/ModelFactory');

// Web组件
const ResponseFormatter = require('./web/response/ResponseFormatter');
const RouteLoader = require('./web/routes/RouteLoader');
const AuthMiddleware = require('./web/middlewares/auth/AuthMiddleware');
const ErrorHandler = require('./web/middlewares/handling/ErrorHandler');
const PerformanceMonitor = require('./web/middlewares/performance/PerformanceMonitor');

// 外部服务组件
const EmailService = require('./external/messaging/email/EmailService');

// 先注册没有依赖的组件
container.register('logger', LoggerService, { singleton: true });
container.register('cache', MemoryCache, { 
  singleton: true,
  dependencies: ['logger']
});
container.register('responseFormatter', ResponseFormatter, { singleton: true });
container.register('idGenerator', IDGenerator, { singleton: true });

// 注册带依赖的组件
container.register('database', DatabaseConnector, { 
  singleton: true,
  dependencies: ['logger']
});

container.register('schemaMapper', SchemaMapper, { 
  singleton: true,
  dependencies: ['logger']
});

container.register('modelFactory', ModelFactory, { 
  singleton: true,
  dependencies: ['database', 'container']
});

container.register('routeLoader', RouteLoader, { 
  singleton: true,
  dependencies: ['logger']
});

container.register('authMiddleware', AuthMiddleware, {
  singleton: true,
  dependencies: ['responseFormatter', 'modelFactory']
});

container.register('emailService', EmailService, {
  singleton: true,
  dependencies: ['logger']
});

// 注册Web中间件
container.register('errorHandler', ErrorHandler, {
  singleton: true,
  dependencies: ['logger']
});

container.register('performanceMonitor', PerformanceMonitor, {
  singleton: true,
  dependencies: ['logger']
});

// 注册容器自身，允许将容器传递给需要的组件
container.register('container', container, { singleton: true });

// 为了向后兼容，获取单例实例
const loggerInstance = container.resolve('logger');
const cacheInstance = container.resolve('cache');
const databaseInstance = container.resolve('database');
const responseFormatterInstance = container.resolve('responseFormatter');

// 仅导出容器
module.exports = {
  // 依赖注入容器
  container
};

// 为兼容性导出顶级组件（简化）
module.exports.Database = databaseInstance;
module.exports.DataAccess = BaseRepository;
module.exports.ResponseUtil = responseFormatterInstance;
module.exports.Logger = loggerInstance;
module.exports.MemoryCache = cacheInstance;
