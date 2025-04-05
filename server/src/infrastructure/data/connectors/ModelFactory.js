const path = require('path');
const BaseRepository = require('../repositories/BaseRepository');

/**
 * 模型工厂类
 * 负责创建与获取应用的数据模型
 */
class ModelFactory {
  /**
   * 创建ModelFactory实例
   * @param {Object} database - 数据库连接器实例
   * @param {Object} container - 依赖注入容器
   */
  constructor(database, container = null) {
    this.database = database;
    this.container = container;
    
    // 模型缓存
    this.modelCache = {};
    // 仓储缓存
    this.repositoryCache = {};
  }
  
  /**
   * 获取或创建模型
   * @param {String|Object} modelDef - 模型定义或模型名称
   * @param {String} domainPath - 模型所在的领域路径
   * @returns {Object} 数据库模型实例
   */
  getModel(modelDef, domainPath) {
    // 如果传入的是模型定义对象而不是字符串，直接返回该对象
    if (typeof modelDef === 'object' && modelDef.constructor.name !== 'String') {
      return modelDef;
    }
    
    const modelName = modelDef;
    
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
   * 创建仓储实例
   * @param {String|Object} modelDef - 模型定义或模型名称
   * @param {String} domainPath - 模型所在的领域路径
   * @returns {BaseRepository} 仓储实例
   */
  createRepository(modelDef, domainPath) {
    const model = this.getModel(modelDef, domainPath);
    const dbType = this.getDbType();
    
    // 如果有容器，使用容器提供的logger和BaseRepository
    if (this.container) {
      const logger = this.container.resolve('logger');
      const BaseRepositoryClass = require('../repositories/BaseRepository');
      return new BaseRepositoryClass(model, logger, dbType);
    } else {
      // 兼容性处理，直接实例化
      const logger = console;
      const BaseRepositoryClass = require('../repositories/BaseRepository');
      return new BaseRepositoryClass(model, logger, dbType);
    }
  }

  /**
   * 获取已缓存的仓储实例，或创建新的实例
   * @param {String|Object} modelDef - 模型定义或模型名称
   * @param {String} domainPath - 模型所在的领域路径
   * @returns {BaseRepository} 仓储实例
   */
  getRepository(modelDef, domainPath) {
    // 如果传入的是模型定义对象而不是字符串，无法缓存，直接创建新实例
    if (typeof modelDef === 'object' && modelDef.constructor.name !== 'String') {
      return this.createRepository(modelDef, domainPath);
    }
    
    const modelName = modelDef;
    const cacheKey = `${domainPath}/${modelName}`;
    
    // 如果缓存中已有该仓储，直接返回
    if (this.repositoryCache[cacheKey]) {
      return this.repositoryCache[cacheKey];
    }
    
    // 创建新的仓储实例
    const repository = this.createRepository(modelDef, domainPath);
    
    // 将仓储保存到缓存
    this.repositoryCache[cacheKey] = repository;
    return repository;
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
      this.repositoryCache = {};
      return;
    }
    
    if (modelName && domainPath) {
      // 清除特定模型的缓存
      const cacheKey = `${domainPath}/${modelName}`;
      delete this.modelCache[cacheKey];
      delete this.repositoryCache[cacheKey];
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
      Object.keys(this.repositoryCache).forEach(key => {
        if (key.startsWith(prefix)) {
          delete this.repositoryCache[key];
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
      Object.keys(this.repositoryCache).forEach(key => {
        if (key.endsWith(`/${modelName}`)) {
          delete this.repositoryCache[key];
        }
      });
    }
  }
  
  /**
   * 获取数据库类型
   * @returns {String} 当前使用的数据库类型
   */
  getDbType() {
    return this.database.getType();
  }
}

module.exports = ModelFactory; 