const { dbType } = require('./Database');
const path = require('path');

/**
 * 模型工厂类
 * 负责创建与获取应用的数据模型
 */
class ModelFactory {
  /**
   * 创建ModelFactory实例
   */
  constructor() {
    // 模型缓存
    this.modelCache = {};
  }
  
  /**
   * 获取或创建模型
   * @param {String} modelName - 模型名称
   * @param {String} domainPath - 模型所在的领域路径
   * @returns {Object} 数据库模型实例
   */
  getModel(modelName, domainPath) {
    // 生成模型的缓存键
    const cacheKey = `${domainPath}/${modelName}`;
    
    // 如果缓存中已有该模型，直接返回
    if (this.modelCache[cacheKey]) {
      return this.modelCache[cacheKey];
    }
    
    try {
      // 尝试加载模型定义
      const modelDefPath = path.resolve(process.cwd(), 'src', 'domains', domainPath, 'models', modelName);
      const moduleExports = require(modelDefPath);
      
      // 获取模型定义（优先使用default导出）
      const model = moduleExports.default || moduleExports;
      
      // 将模型保存到缓存
      this.modelCache[cacheKey] = model;
      return model;
    } catch (error) {
      throw new Error(`无法加载模型 ${modelName}: ${error.message}`);
    }
  }
  
  /**
   * 清除模型缓存
   * @param {String} modelName - 要清除的模型名称，如不提供则清除所有缓存
   * @param {String} domainPath - 模型所在的领域路径，如不提供则清除所有缓存
   */
  clearCache(modelName, domainPath) {
    if (!modelName && !domainPath) {
      // 清除所有缓存
      this.modelCache = {};
      return;
    }
    
    if (modelName && domainPath) {
      // 清除特定模型的缓存
      const cacheKey = `${domainPath}/${modelName}`;
      delete this.modelCache[cacheKey];
      return;
    }
    
    if (domainPath) {
      // 清除特定领域的所有模型缓存
      const prefix = `${domainPath}/`;
      Object.keys(this.modelCache).forEach(key => {
        if (key.startsWith(prefix)) {
          delete this.modelCache[key];
        }
      });
      return;
    }
    
    if (modelName) {
      // 清除所有领域中特定名称的模型缓存
      Object.keys(this.modelCache).forEach(key => {
        if (key.endsWith(`/${modelName}`)) {
          delete this.modelCache[key];
        }
      });
    }
  }
}

// 创建并导出ModelFactory单例
const modelFactory = new ModelFactory();
module.exports = modelFactory; 