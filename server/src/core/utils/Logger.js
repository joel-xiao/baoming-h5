const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

// 确保日志目录存在
const logDir = path.join(__dirname, '../../../logs');
fs.ensureDirSync(logDir);

/**
 * 日志级别
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * 根据环境选择日志级别
 */
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

/**
 * 日志格式配置
 */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

/**
 * 控制台和文件处理器
 */
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      format
    ),
  }),
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
  }),
  // 所有日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
  }),
];

/**
 * 创建日志记录器
 */
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger; 