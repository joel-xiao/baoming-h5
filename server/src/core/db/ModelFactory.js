const { dbType } = require('./Database');

/**
 * 模型工厂类
 * 根据当前数据库类型创建适当的模型
 */
class ModelFactory {
  /**
   * 获取适用于当前数据库类型的模型
   * @param {Object} moduleExports - 模型模块的导出对象
   * @returns {Object} 当前数据库类型的模型实现
   */
  static getModel(moduleExports) {
    if (!moduleExports) {
      throw new Error('模型定义不能为空');
    }

    // 处理默认导出格式
    const modelDefinitions = moduleExports.default || moduleExports;
    
    // 如果模块只导出了常量，没有默认导出模型
    if (!modelDefinitions[dbType]) {
      throw new Error(`模块未导出 ${dbType} 类型的模型`);
    }

    // 根据当前数据库类型选择对应的模型实现
    const model = modelDefinitions[dbType];
    
    if (!model) {
      throw new Error(`${dbType} 类型的模型未定义`);
    }
    
    return model;
  }
}

module.exports = ModelFactory; 