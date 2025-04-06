/**
 * 性能监控中间件
 * 用于监控API请求执行时间和资源使用情况
 */

class PerformanceMonitor {
  /**
   * 创建性能监控中间件实例
   * @param {Object} logger - 日志服务
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * 创建性能监控中间件
   * @param {Object} options - 配置选项
   * @param {number} options.slowThreshold - 慢请求阈值(毫秒)，超过该值将被记录为警告
   * @param {boolean} options.logAllRequests - 是否记录所有请求
   * @param {Array<string>} options.excludePaths - 排除监控的路径
   * @returns {Function} Express中间件函数
   */
  middleware(options = {}) {
    const {
      slowThreshold = 1000,
      logAllRequests = false,
      excludePaths = ['/health', '/favicon.ico']
    } = options;

    return (req, res, next) => {
      // 检查是否需要排除该路径
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // 记录请求开始时间
      const startTime = process.hrtime();
      const startMemory = process.memoryUsage();
      
      // 记录当前请求信息
      const reqInfo = {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || '-',
      };

      // 请求结束时的处理函数
      const logPerformance = () => {
        // 计算请求处理时间
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = (seconds * 1000) + (nanoseconds / 1000000);
        
        // 计算内存使用差异
        const endMemory = process.memoryUsage();
        const memoryDiff = {
          rss: Math.round((endMemory.rss - startMemory.rss) / 1024),
          heapTotal: Math.round((endMemory.heapTotal - startMemory.heapTotal) / 1024),
          heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024),
        };

        // 准备日志数据
        const perfData = {
          ...reqInfo,
          statusCode: res.statusCode,
          duration: duration.toFixed(2),
          memory: memoryDiff,
        };

        // 根据处理时间决定日志级别
        if (duration > slowThreshold) {
          this.logger.warn(`慢请求: ${reqInfo.method} ${reqInfo.url} - ${duration.toFixed(2)}ms`, {
            performance: perfData
          });
        } else if (logAllRequests) {
          this.logger.info(`请求完成: ${reqInfo.method} ${reqInfo.url} - ${duration.toFixed(2)}ms`, {
            performance: perfData
          });
        }
      };

      // 监听响应结束事件
      res.on('finish', logPerformance.bind(this));
      res.on('close', logPerformance.bind(this));

      next();
    };
  }

  /**
   * 旧版静态工厂方法，用于向后兼容
   */
  static create(options = {}) {
    return (req, res, next) => {
      const container = req.app.get('container');
      const performanceMonitor = container.resolve('performanceMonitor');
      return performanceMonitor.middleware(options)(req, res, next);
    };
  }
}

module.exports = PerformanceMonitor; 