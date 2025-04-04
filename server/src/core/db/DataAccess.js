const logger = require('../utils/Logger');
const { dbType } = require('./Database');

/**
 * 数据访问层
 * 对数据库操作进行封装，提供统一的接口
 */
class DataAccess {
  /**
   * @param {Object} model - 当前使用的模型
   */
  constructor(model) {
    this.model = model;
    this.dbType = dbType;
  }

  /**
   * 创建记录
   * @param {Object} data - 要创建的数据
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data) {
    try {
      logger.debug(`创建记录: ${this.model.name || '未知模型'}, 数据库类型: ${this.dbType}`);
      return await this.model.create(data);
    } catch (error) {
      logger.error(`创建记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查找单个记录
   * @param {Object} query - 查询条件
   * @returns {Promise<Object>} 找到的记录
   */
  async findOne(query) {
    try {
      logger.debug(`查找单个记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.findOne(query);
    } catch (error) {
      logger.error(`查找单个记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查找多个记录
   * @param {Object} query - 查询条件
   * @param {Object} options - 排序、分页等选项
   * @returns {Promise<Array>} 找到的记录数组
   */
  async find(query = {}, options = {}) {
    try {
      logger.debug(`查找多个记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.find(query, options);
    } catch (error) {
      logger.error(`查找多个记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {Object} query - 查询条件
   * @param {Object} update - 更新内容
   * @param {Object} options - 更新选项
   * @returns {Promise<Object>} 更新结果
   */
  async update(query, update, options = {}) {
    try {
      logger.debug(`更新记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.update(query, update, options);
    } catch (error) {
      logger.error(`更新记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除记录
   * @param {Object} query - 查询条件
   * @returns {Promise<Object>} 删除结果
   */
  async delete(query) {
    try {
      logger.debug(`删除记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.delete(query);
    } catch (error) {
      logger.error(`删除记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 统计记录数量
   * @param {Object} query - 查询条件
   * @returns {Promise<Number>} 记录数量
   */
  async count(query = {}) {
    try {
      logger.debug(`统计记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.count(query);
    } catch (error) {
      logger.error(`统计记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 分页查询
   * @param {Object} query - 查询条件
   * @param {Number} page - 页码
   * @param {Number} limit - 每页记录数
   * @param {Object} sort - 排序方式
   * @returns {Promise<Object>} 分页结果
   */
  async paginate(query = {}, page = 1, limit = 10, sort = {}) {
    try {
      logger.debug(`分页查询: ${this.model.name || '未知模型'}, 页码: ${page}, 每页: ${limit}`);
      const skip = (page - 1) * limit;
      const options = { skip, limit, sort };
      
      const [data, total] = await Promise.all([
        this.find(query, options),
        this.count(query)
      ]);
      
      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`分页查询失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DataAccess; 