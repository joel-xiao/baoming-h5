// 优先加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { EventEmitter } = require('events');
const path = require('path');

// 配置文件
const appConfig = require('./config/app');

// 工具
const logger = require('./infrastructure/utils/helper/Logger');
const RouteLoader = require('./infrastructure/utils/helper/RouteLoader');
const errorHandler = require('./infrastructure/middleware/errorHandler');
const { Database } = require('./infrastructure/database/connectors/Database');

// 创建Express应用
const app = express();

// 设置全局事件发射器
const eventEmitter = global.eventEmitter || new EventEmitter();
global.eventEmitter = eventEmitter;
app.set('eventEmitter', eventEmitter);

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 设置静态文件目录
app.use('/static', express.static(path.join(__dirname, 'static')));

// 初始化数据库连接
Database.connect().then(() => {
  logger.info('数据库连接成功');
  
  // 加载所有领域路由
  RouteLoader.loadDomainRoutes(app, path.join(__dirname, 'domains'), '/api');
  
  logger.info('所有领域路由加载完成');
}).catch(err => {
  logger.error(`数据库连接失败: ${err.message}`);
});

// 首页
app.get('/', (req, res) => {
  res.send('团队报名系统 API 服务已启动');
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '请求的资源不存在' 
  });
});

// 错误处理中间件
app.use(errorHandler);

module.exports = app; 