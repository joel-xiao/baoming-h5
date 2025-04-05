/**
 * 性能优化相关配置
 */
module.exports = {
  // 慢请求阈值（毫秒），超过该时间的请求将被记录为警告
  slowThreshold: process.env.PERFORMANCE_SLOW_THRESHOLD || 1000,
  
  // 是否记录所有请求的性能数据
  logAllRequests: process.env.PERFORMANCE_LOG_ALL === 'true',
  
  // 缓存配置
  cache: {
    // 默认缓存时间（秒）
    defaultTTL: process.env.CACHE_DEFAULT_TTL || 300,
    
    // 是否启用内存缓存
    enableMemoryCache: process.env.ENABLE_MEMORY_CACHE !== 'false',
    
    // 最大缓存项数
    maxItems: process.env.CACHE_MAX_ITEMS || 1000
  },
  
  // 数据库查询性能配置
  database: {
    // 慢查询阈值（毫秒）
    slowQueryThreshold: process.env.DB_SLOW_QUERY_THRESHOLD || 200,
    
    // 是否记录所有查询
    logAllQueries: process.env.DB_LOG_ALL_QUERIES === 'true',
    
    // 是否启用查询缓存
    enableQueryCache: process.env.DB_ENABLE_QUERY_CACHE !== 'false',
    
    // 批量操作大小
    batchSize: process.env.DB_BATCH_SIZE || 100
  }
}; 