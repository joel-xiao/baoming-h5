// 注册模块别名
require('module-alias/register');

// 优先加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { EventEmitter } = require('events');
const path = require('path');

// 导入基础设施层（这会注册所有组件到容器中）
const infrastructure = require('./infrastructure');
const container = infrastructure.container;

// 从容器中获取依赖
const logger = container.resolve('logger');
const errorHandler = container.resolve('errorHandler');
const performanceMonitor = container.resolve('performanceMonitor');
const Database = infrastructure.Database;
const RouteLoader = container.resolve('routeLoader');

// 配置文件
const appConfig = require('./config/app');

// 创建Express应用
const app = express();

// 设置全局事件发射器
const eventEmitter = global.eventEmitter || new EventEmitter();
global.eventEmitter = eventEmitter;
app.set('eventEmitter', eventEmitter);

// 设置依赖注入容器
app.set('container', container);

// 基础中间件
app.use(helmet());
app.use(cors());
app.use(compression()); // 添加压缩中间件，提高性能
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 性能监控中间件
app.use(performanceMonitor.middleware({
  slowThreshold: appConfig.performance?.slowThreshold || 1000,
  logAllRequests: appConfig.performance?.logAllRequests || false
}));

// 设置静态文件目录
app.use('/static', express.static(path.join(__dirname, 'static'), {
  maxAge: '1d' // 添加缓存控制，提高性能
}));

// 首页
app.get('/', (req, res) => {
  res.send('团队报名系统 API 服务已启动');
});

// 健康检查端点 - 用于监控
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

/**
 * 应用服务器启动器
 * 负责启动HTTP服务器并管理生命周期
 */
class ServerBootstrap {
  constructor() {
    this.server = null;
    this.port = process.env.PORT || appConfig.port || 3000;
    this.maxPortRetries = 3; // 最大端口重试次数
    this.portRetryCount = 0;
    
    // 保存基础设施组件引用
    this.logger = logger;
    this.database = Database;
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      // 连接数据库
      await this.database.connect();
      this.logger.info(`成功连接到${appConfig.dbType}数据库`);
      
      // 加载所有领域路由
      RouteLoader.loadRoutes(app);
      this.logger.info('所有领域路由加载完成');
      
      // 启动HTTP服务器
      this.startHttpServer();
    } catch (error) {
      this.logger.error(`服务器启动失败: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * 启动HTTP服务器
   */
  startHttpServer() {
    try {
      this.server = app.listen(this.port, () => {
        this.logger.info(`服务器已启动，监听端口: ${this.port}`);
        this.logger.info(`服务器环境: ${appConfig.env}`);
        this.logger.info(`API基础路径: ${appConfig.baseUrl}${appConfig.apiPrefix}`);
        this.logger.info(`数据库类型: ${appConfig.dbType}`);
        
        // 设置错误处理
        this.setupErrorHandlers();
      });
      
      // 处理服务器错误
      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          this.logger.warn(`端口 ${this.port} 已被占用`);
          
          if (this.portRetryCount < this.maxPortRetries) {
            this.portRetryCount++;
            this.port++;
            this.logger.info(`尝试使用端口 ${this.port}`);
            this.server.close();
            this.startHttpServer();
          } else {
            this.logger.error(`无法找到可用端口，已尝试 ${this.maxPortRetries + 1} 个端口`);
            this.gracefulShutdown(1);
          }
        } else {
          this.logger.error(`服务器错误: ${err.message}`);
          this.gracefulShutdown(1);
        }
      });
    } catch (error) {
      this.logger.error(`启动HTTP服务器失败: ${error.message}`);
      this.gracefulShutdown(1);
    }
  }
  
  /**
   * 设置错误处理器
   */
  setupErrorHandlers() {
    // 处理未捕获的异常
    process.on('uncaughtException', (err) => {
      this.logger.error(`未捕获的异常: ${err.message}`, err);
      this.gracefulShutdown(1);
    });
    
    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error(`未处理的Promise拒绝: ${reason}`);
    });
    
    // 优雅关闭
    ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
      process.on(signal, () => {
        this.logger.info(`收到${signal}信号，正在关闭服务...`);
        this.gracefulShutdown(0);
      });
    });
  }
  
  /**
   * 优雅关闭服务
   */
  gracefulShutdown(exitCode) {
    this.logger.info('开始优雅关闭服务...');
    
    if (this.server) {
      this.server.close(() => {
        this.logger.info('HTTP服务器已关闭');
        process.exit(exitCode);
      });
      
      // 如果10秒内未能关闭，则强制退出
      setTimeout(() => {
        this.logger.error('强制关闭服务');
        process.exit(exitCode);
      }, 10000);
    } else {
      process.exit(exitCode);
    }
  }
}

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '请求的资源不存在' 
  });
});

// 错误处理中间件
app.use((err, req, res, next) => errorHandler.handle(err, req, res, next));

// 预热初始化服务
logger.info('正在初始化领域服务...');

// 确保关键领域服务已实例化
try {
  // 这里直接引用服务单例，触发它们的初始化
  const registrationService = require('./domains/registration/services/RegistrationService');
  const teamService = require('./domains/registration/subdomains/team/services/TeamService');
  const individualService = require('./domains/registration/subdomains/individual/services/IndividualService');
  const paymentService = require('./domains/payment/services/PaymentService');
  const authService = require('./domains/account/subdomains/auth/services/AuthService');
  
  logger.info('领域服务初始化完成');
} catch (error) {
  logger.error(`领域服务初始化失败: ${error.message}`);
}

// 启动服务器
const bootstrap = new ServerBootstrap();
bootstrap.start(); 