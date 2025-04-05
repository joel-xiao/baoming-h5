/**
 * 内存缓存服务
 * 提供简单的内存缓存机制，用于优化频繁访问的数据
 */
const performanceConfig = require('@config/performance');

class MemoryCache {
  /**
   * 创建内存缓存实例
   * @param {Object} logger - 日志服务
   * @param {Object} options - 配置选项
   */
  constructor(logger, options = {}) {
    this.logger = logger;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // 配置选项
    this.options = {
      defaultTTL: options.defaultTTL || performanceConfig.cache.defaultTTL,
      maxItems: options.maxItems || performanceConfig.cache.maxItems,
      checkPeriod: options.checkPeriod || 60 // 默认每60秒检查一次过期缓存
    };
    
    // 启动定期清理过期缓存的任务
    this._startCleanupTask();
  }
  
  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @returns {*} 缓存值，如果不存在或已过期则返回null
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }
  
  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 生存时间(秒)，如果不提供则使用默认值
   * @returns {boolean} 是否成功设置
   */
  set(key, value, ttl) {
    // 如果达到最大缓存数量，先执行LRU清理
    if (this.cache.size >= this.options.maxItems) {
      this._evictLRU();
    }
    
    const ttlSeconds = ttl || this.options.defaultTTL;
    const expiry = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
    
    this.cache.set(key, {
      value,
      expiry,
      lastAccessed: Date.now()
    });
    
    this.stats.sets++;
    return true;
  }
  
  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {boolean} 是否成功删除
   */
  delete(key) {
    const result = this.cache.delete(key);
    if (result) {
      this.stats.deletes++;
    }
    return result;
  }
  
  /**
   * 检查缓存键是否存在
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在且未过期
   */
  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      this.delete(key);
      return false;
    }
    
    // 更新最后访问时间
    item.lastAccessed = Date.now();
    return true;
  }
  
  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.resetStats();
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const totalOperations = this.stats.hits + this.stats.misses;
    const hitRate = totalOperations > 0 ? (this.stats.hits / totalOperations) * 100 : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%'
    };
  }
  
  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
  
  /**
   * 启动定期清理过期缓存的任务
   * @private
   */
  _startCleanupTask() {
    const cleanupInterval = setInterval(() => {
      this._cleanExpired();
    }, this.options.checkPeriod * 1000);
    
    // 确保进程退出时清理定时器
    cleanupInterval.unref();
  }
  
  /**
   * 清理过期的缓存项
   * @private
   */
  _cleanExpired() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && item.expiry < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.debug(`缓存清理: 移除了${expiredCount}个过期项`);
    }
  }
  
  /**
   * 根据LRU策略驱逐缓存项
   * @private
   */
  _evictLRU() {
    let oldest = null;
    let oldestKey = null;
    
    // 找出最久未使用的缓存项
    for (const [key, item] of this.cache.entries()) {
      if (oldest === null || item.lastAccessed < oldest) {
        oldest = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    // 删除最久未使用的缓存项
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug(`缓存驱逐: 移除了LRU项 ${oldestKey}`);
    }
  }
}

module.exports = MemoryCache; 