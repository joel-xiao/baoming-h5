const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const logger = require('../../core/utils/Logger');
const appConfig = require('../../config/app');

// 确保日志目录存在
const logDirectory = appConfig.logging.directory || path.join(process.cwd(), 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory, { recursive: true });

// 创建一个旋转的写入流
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // 每天旋转
  path: logDirectory,
  size: appConfig.logging.maxSize || '10M',
  maxFiles: appConfig.logging.maxFiles || 14
});

// 自定义日志格式
const customFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// 开发环境日志中间件
const developmentLogging = morgan('dev', {
  skip: (req, res) => res.statusCode < 400
});

// 生产环境日志中间件
const productionLogging = morgan(customFormat, {
  stream: accessLogStream
});

/**
 * HTTP请求日志中间件
 * 根据环境选择适当的日志格式
 */
const requestLogger = (req, res, next) => {
  // 根据环境选择日志中间件
  if (process.env.NODE_ENV === 'production') {
    return productionLogging(req, res, next);
  } else {
    return developmentLogging(req, res, next);
  }
};

/**
 * 请求ID中间件
 * 为每个请求分配唯一ID，便于跟踪
 */
const requestId = (req, res, next) => {
  const id = require('crypto').randomBytes(16).toString('hex');
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * 详细请求日志中间件
 * 记录详细的请求信息，包括请求体、查询参数等
 */
const detailedRequestLogger = (req, res, next) => {
  // 不记录健康检查请求的日志
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  const startTime = Date.now();
  const requestId = req.id || 'unknown';
  
  // 记录请求开始信息
  logger.info(`[${requestId}] 开始请求: ${req.method} ${req.originalUrl}`);
  
  // 记录请求头信息（排除敏感信息）
  const sanitizedHeaders = { ...req.headers };
  delete sanitizedHeaders.authorization;
  delete sanitizedHeaders.cookie;
  
  // 记录请求体（排除敏感信息）
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
  if (sanitizedBody.passwordConfirm) sanitizedBody.passwordConfirm = '[REDACTED]';
  
  // 防止日志太大，如果请求体太大只记录部分
  const bodyString = JSON.stringify(sanitizedBody);
  const truncatedBody = bodyString.length > 1000 
    ? bodyString.substring(0, 1000) + '... [truncated]' 
    : bodyString;
  
  if (Object.keys(req.body).length > 0) {
    logger.debug(`[${requestId}] 请求体: ${truncatedBody}`);
  }
  
  if (Object.keys(req.query).length > 0) {
    logger.debug(`[${requestId}] 查询参数: ${JSON.stringify(req.query)}`);
  }
  
  // 捕获响应
  const originalSend = res.send;
  res.send = function(body) {
    res.responseBody = body;
    originalSend.apply(res, arguments);
  };
  
  // 记录响应信息
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](
      `[${requestId}] 完成请求: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
    
    // 在开发环境或出错时记录响应体
    if ((process.env.NODE_ENV === 'development' || res.statusCode >= 400) && res.responseBody) {
      try {
        let responseBody = JSON.parse(res.responseBody);
        // 如果响应体太大只记录部分
        const responseString = JSON.stringify(responseBody);
        const truncatedResponse = responseString.length > 1000 
          ? responseString.substring(0, 1000) + '... [truncated]' 
          : responseString;
          
        logger.debug(`[${requestId}] 响应体: ${truncatedResponse}`);
      } catch (e) {
        // 如果不是JSON，不记录或只记录部分
        if (typeof res.responseBody === 'string' && res.responseBody.length > 0) {
          const truncatedResponse = res.responseBody.length > 100 
            ? res.responseBody.substring(0, 100) + '... [truncated]' 
            : res.responseBody;
          logger.debug(`[${requestId}] 响应体: ${truncatedResponse}`);
        }
      }
    }
  });
  
  next();
};

module.exports = {
  requestLogger,
  requestId,
  detailedRequestLogger
}; 