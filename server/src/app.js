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

// 导入基础设施层
const infrastructure = require('./infrastructure');
const container = infrastructure.container;

// 从容器中获取依赖
const logger = container.resolve('logger');
const errorHandler = container.resolve('errorHandler');
const performanceMonitor = container.resolve('performanceMonitor');
const database = container.resolve('database');
const RouteLoader = container.resolve('routeLoader');

// 配置文件
const appConfig = require('./config/app');

// 创建Express应用
const app = express();

// 设置全局事件和容器
const eventEmitter = global.eventEmitter || new EventEmitter();
global.eventEmitter = eventEmitter;
app.set('eventEmitter', eventEmitter);
app.set('container', container);

// 基础中间件
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 性能监控中间件
app.use(performanceMonitor.middleware({
  slowThreshold: appConfig.performance?.slowThreshold || 1000,
  logAllRequests: appConfig.performance?.logAllRequests || false
}));

// 设置静态文件目录
app.use('/static', express.static(path.join(__dirname, 'static'), {
  maxAge: '1d'
}));

// 首页
app.get('/', (req, res) => {
  res.send('团队报名系统 API 服务已启动');
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

/**
 * 应用服务器启动器
 */
class ServerBootstrap {
  constructor() {
    this.server = null;
    this.port = process.env.PORT || appConfig.port || 3000;
    this.maxPortRetries = 3;
    this.portRetryCount = 0;
    
    this.logger = logger;
    this.database = database;
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      await this.database.connect();
      
      RouteLoader.loadRoutes(app, {
        domainBasePath: path.resolve(__dirname, 'domains'),
        routeFileName: 'routes.js'
      });
      
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
        this.logger.info(`服务已启动 [端口:${this.port}, 环境:${appConfig.env}, 数据库:${appConfig.dbType}]`);
        this.setupErrorHandlers();
      });
      
      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          if (this.portRetryCount < this.maxPortRetries) {
            this.portRetryCount++;
            this.port++;
            this.logger.info(`尝试使用端口 ${this.port}`);
            this.server.close();
            this.startHttpServer();
          } else {
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
    process.on('uncaughtException', (err) => {
      this.logger.error(`未捕获的异常: ${err.message}`);
      this.gracefulShutdown(1);
    });
    
    process.on('unhandledRejection', (reason) => {
      this.logger.error(`未处理的Promise拒绝: ${reason}`);
    });
    
    ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
      process.on(signal, () => {
        this.gracefulShutdown(0);
      });
    });
  }
  
  /**
   * 优雅关闭服务
   */
  gracefulShutdown(exitCode) {
    this.logger.info('关闭服务...');
    
    if (this.server) {
      this.server.close(() => {
        process.exit(exitCode);
      });
      
      setTimeout(() => {
        process.exit(exitCode);
      }, 10000);
    } else {
      process.exit(exitCode);
    }
  }
}

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '请求的资源不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => errorHandler.handle(err, req, res, next));

// 启动服务器
const bootstrap = new ServerBootstrap();
bootstrap.start(); 