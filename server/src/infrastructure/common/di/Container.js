/**
 * 轻量级依赖注入容器
 * 提供依赖注册、解析和生命周期管理功能
 */
class Container {
  constructor() {
    this.dependencies = new Map();
    this.singletons = new Map();
  }

  /**
   * 注册依赖
   * @param {string} name - 依赖名称
   * @param {Function|Object} implementation - 依赖的实现（类构造函数或实例）
   * @param {Object} options - 配置选项
   * @param {boolean} options.singleton - 是否为单例
   * @param {Array} options.dependencies - 该依赖的依赖项列表
   */
  register(name, implementation, options = {}) {
    this.dependencies.set(name, {
      implementation,
      singleton: options.singleton === true,
      dependencies: options.dependencies || []
    });
    return this;
  }

  /**
   * 获取依赖实例
   * @param {string} name - 依赖名称
   * @returns {Object} 依赖实例
   */
  resolve(name) {
    const dependency = this.dependencies.get(name);
    
    if (!dependency) {
      throw new Error(`依赖 ${name} 未注册`);
    }

    // 如果是单例并且已存在实例，直接返回
    if (dependency.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    const instance = this.createInstance(dependency);
    
    // 如果是单例，缓存实例
    if (dependency.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * 创建依赖实例
   * @private
   * @param {Object} dependency - 依赖定义
   * @returns {Object} 依赖实例
   */
  createInstance(dependency) {
    const { implementation, dependencies } = dependency;

    // 如果是函数（构造函数），则实例化
    if (typeof implementation === 'function') {
      // 解析构造函数的依赖
      const resolvedDependencies = dependencies.map(dep => this.resolve(dep));
      return new implementation(...resolvedDependencies);
    }
    
    // 否则直接返回实现
    return implementation;
  }

  /**
   * 检查是否已注册依赖
   * @param {string} name - 依赖名称
   * @returns {boolean} 是否已注册
   */
  has(name) {
    return this.dependencies.has(name);
  }

  /**
   * 移除依赖
   * @param {string} name - 依赖名称
   * @returns {boolean} 是否成功移除
   */
  remove(name) {
    if (this.singletons.has(name)) {
      this.singletons.delete(name);
    }
    return this.dependencies.delete(name);
  }

  /**
   * 清空容器
   */
  clear() {
    this.dependencies.clear();
    this.singletons.clear();
  }
}

// 创建全局容器实例
const container = new Container();

module.exports = container; 