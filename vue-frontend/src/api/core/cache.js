/**
 * API缓存工具
 * 用于减少重复API请求，提高性能
 */

// 缓存存储对象
const apiCache = new Map();

// 默认缓存时间（毫秒）
const DEFAULT_CACHE_TIME = 60 * 1000; // 1分钟

/**
 * 生成缓存键
 * @param {string} url - API地址
 * @param {Object} params - 请求参数
 * @returns {string} 缓存键
 */
const generateCacheKey = (url, params = {}) => {
  return `${url}:${JSON.stringify(params)}`;
};

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} data - 要缓存的数据
 * @param {number} cacheTime - 缓存时间（毫秒）
 */
export const setCache = (key, data, cacheTime = DEFAULT_CACHE_TIME) => {
  const expireTime = Date.now() + cacheTime;
  apiCache.set(key, {
    data,
    expireTime
  });
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {any|null} 缓存的数据或null（如果缓存不存在或已过期）
 */
export const getCache = (key) => {
  if (!apiCache.has(key)) {
    return null;
  }

  const cache = apiCache.get(key);
  
  // 检查缓存是否过期
  if (cache.expireTime < Date.now()) {
    apiCache.delete(key);
    return null;
  }

  return cache.data;
};

/**
 * 清除指定缓存
 * @param {string} key - 缓存键
 */
export const clearCache = (key) => {
  if (key) {
    apiCache.delete(key);
  }
};

/**
 * 清除所有缓存
 */
export const clearAllCache = () => {
  apiCache.clear();
};

/**
 * 缓存装饰器，用于为API请求添加缓存功能
 * @param {Function} apiFunction - API请求函数
 * @param {Object} options - 缓存选项
 * @returns {Function} 包装后的函数
 */
export const withCache = (apiFunction, options = {}) => {
  const { cacheTime = DEFAULT_CACHE_TIME, keyGenerator } = options;
  
  return async (...args) => {
    // 生成缓存键
    const key = keyGenerator 
      ? keyGenerator(...args) 
      : generateCacheKey(apiFunction.name, args);
    
    // 尝试从缓存获取数据
    const cachedData = getCache(key);
    if (cachedData) {
      return cachedData;
    }
    
    // 调用原始API函数
    const result = await apiFunction(...args);
    
    // 缓存结果
    if (result && result.success) {
      setCache(key, result, cacheTime);
    }
    
    return result;
  };
};

export default {
  setCache,
  getCache,
  clearCache,
  clearAllCache,
  withCache
}; 