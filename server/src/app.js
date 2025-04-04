const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');

// 导入配置
const appConfig = require('./config/app');
const { dbType } = require('./config/database');

// 导入数据库连接
const { Database } = require('./core/db/Database');

// 导入路由
const apiRoutes = require('./api/routes');

// 导入日志工具
const logger = require('./core/utils/Logger');

// 创建Express应用
const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: appConfig.corsOrigins,
  credentials: true
}));
app.use(helmet());
app.use(compression());

// 日志中间件
if (appConfig.env === 'development') {
  app.use(morgan('dev'));
} else {
  // 创建日志目录
  const logDirectory = path.join(__dirname, '../logs');
  fs.ensureDirSync(logDirectory);
  
  // 创建日志写入流
  const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'),
    { flags: 'a' }
  );
  
  // 使用combined格式并写入文件
  app.use(morgan('combined', { stream: accessLogStream }));
}

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use(appConfig.apiPrefix, apiRoutes);

// 404处理
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  
  const status = err.status || 500;
  const message = appConfig.env === 'production' && status === 500
    ? '服务器内部错误'
    : err.message;
  
  res.status(status).json({
    success: false,
    message,
    ...(appConfig.env !== 'production' && { stack: err.stack })
  });
});

// 启动应用
async function startServer() {
  try {
    // 连接数据库
    await Database.connect();
    logger.info(`已连接到 ${dbType} 数据库`);
    
    // 创建上传目录
    fs.ensureDirSync(path.join(__dirname, '..', appConfig.upload.dir));
    
    // 启动服务器
    const port = appConfig.port;
    app.listen(port, () => {
      logger.info(`服务器运行在 http://localhost:${port}`);
      logger.info(`环境: ${appConfig.env}`);
      logger.info(`API前缀: ${appConfig.apiPrefix}`);
    });
  } catch (error) {
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 导出app供测试使用
module.exports = {
  app,
  startServer
};

// 如果直接运行该文件，则启动服务器
if (require.main === module) {
  startServer();
} 