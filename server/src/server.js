require('module-alias/register');
require('dotenv').config();
const app = require('./app');

// 导入日志工具
const logger = require('./infrastructure/utils/helper/Logger');

// 导入数据库连接管理器
const { Database } = require('./infrastructure/database/connectors/Database');

// 检查关键配置
const appConfig = require('./config/app');

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
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      // 连接数据库
      await Database.connect();
      logger.info(`成功连接到${appConfig.dbType}数据库`);
      
      // 启动HTTP服务器
      this.startHttpServer();
    } catch (error) {
      logger.error(`服务器启动失败: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * 启动HTTP服务器
   */
  startHttpServer() {
    try {
      this.server = app.listen(this.port, () => {
        logger.info(`服务器已启动，监听端口: ${this.port}`);
        logger.info(`服务器环境: ${appConfig.env}`);
        logger.info(`API基础路径: ${appConfig.baseUrl}${appConfig.apiPrefix}`);
        logger.info(`数据库类型: ${appConfig.dbType}`);
        
        // 设置错误处理
        this.setupErrorHandlers();
      });
      
      // 处理服务器错误
      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`端口 ${this.port} 已被占用`);
          
          if (this.portRetryCount < this.maxPortRetries) {
            this.portRetryCount++;
            this.port++;
            logger.info(`尝试使用端口 ${this.port}`);
            this.server.close();
            this.startHttpServer();
          } else {
            logger.error(`无法找到可用端口，已尝试 ${this.maxPortRetries + 1} 个端口`);
            this.gracefulShutdown(1);
          }
        } else {
          logger.error(`服务器错误: ${err.message}`);
          this.gracefulShutdown(1);
        }
      });
    } catch (error) {
      logger.error(`启动HTTP服务器失败: ${error.message}`);
      this.gracefulShutdown(1);
    }
  }
  
  /**
   * 设置错误处理器
   */
  setupErrorHandlers() {
    // 处理未捕获的异常
    process.on('uncaughtException', (err) => {
      logger.error(`未捕获的异常: ${err.message}`, err);
      this.gracefulShutdown(1);
    });
    
    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`未处理的Promise拒绝: ${reason}`);
    });
    
    // 优雅关闭
    ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
      process.on(signal, () => {
        logger.info(`收到${signal}信号，正在关闭服务...`);
        this.gracefulShutdown(0);
      });
    });
  }
  
  /**
   * 优雅关闭服务
   */
  gracefulShutdown(exitCode) {
    logger.info('开始优雅关闭服务...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP服务器已关闭');
        process.exit(exitCode);
      });
      
      // 如果10秒内未能关闭，则强制退出
      setTimeout(() => {
        logger.error('强制关闭服务');
        process.exit(exitCode);
      }, 10000);
    } else {
      process.exit(exitCode);
    }
  }
}

// 清理端口进程的辅助函数
const killPortProcess = (port) => {
  try {
    if (process.platform === 'win32') {
      // Windows系统
      const { execSync } = require('child_process');
      const command = `FOR /F "tokens=5" %p IN ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') DO TaskKill /PID %p /F`;
      execSync(command, { stdio: 'ignore' });
    } else {
      // Linux/Mac系统
      const { execSync } = require('child_process');
      execSync(`lsof -i tcp:${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`, { stdio: 'ignore' });
    }
    logger.info(`已尝试终止占用端口 ${port} 的进程`);
    return true;
  } catch (error) {
    logger.warn(`尝试终止占用端口 ${port} 的进程失败: ${error.message}`);
    return false;
  }
};

// 启动服务器
const bootstrap = new ServerBootstrap();
bootstrap.start(); 