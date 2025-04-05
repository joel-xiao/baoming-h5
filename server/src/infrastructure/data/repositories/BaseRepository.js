/**
 * 数据访问层
 * 对数据库操作进行封装，提供统一的接口
 */
class DataAccess {
  /**
   * @param {Object} model - 当前使用的模型
   * @param {Object} logger - 日志服务
   * @param {string} dbType - 数据库类型
   */
  constructor(model, logger, dbType) {
    this.model = model;
    this.logger = logger;
    this.dbType = dbType;
  }

  /**
   * 创建记录
   * @param {Object} data - 要创建的数据
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data) {
    try {
      this.logger.debug(`创建记录: ${this.model.name || '未知模型'}, 数据库类型: ${this.dbType}`);
      return await this.model.create(data);
    } catch (error) {
      this.logger.error(`创建记录失败: ${error.message}`);
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
      this.logger.debug(`查找单个记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.findOne(query);
    } catch (error) {
      this.logger.error(`查找单个记录失败: ${error.message}`);
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
      this.logger.debug(`查找多个记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.find(query, options);
    } catch (error) {
      this.logger.error(`查找多个记录失败: ${error.message}`);
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
      this.logger.debug(`更新记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.update(query, update, options);
    } catch (error) {
      this.logger.error(`更新记录失败: ${error.message}`);
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
      this.logger.debug(`删除记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.delete(query);
    } catch (error) {
      this.logger.error(`删除记录失败: ${error.message}`);
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
      this.logger.debug(`统计记录: ${this.model.name || '未知模型'}, 查询: ${JSON.stringify(query)}`);
      return await this.model.count(query);
    } catch (error) {
      this.logger.error(`统计记录失败: ${error.message}`);
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
      this.logger.debug(`分页查询: ${this.model.name || '未知模型'}, 页码: ${page}, 每页: ${limit}`);
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
      this.logger.error(`分页查询失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 日期范围查询
   * @param {String} field - 日期字段名
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期(可选)
   * @param {Object} additionalQuery - 附加查询条件(可选)
   * @returns {Promise<Array>} 查询结果
   */
  async findByDateRange(field, startDate, endDate = null, additionalQuery = {}) {
    try {
      this.logger.debug(`日期范围查询: ${this.model.name || '未知模型'}, 字段: ${field}`);
      
      const query = { ...additionalQuery };
      
      if (startDate) {
        query[field] = query[field] || {};
        query[field]['$gte'] = startDate;
      }
      
      if (endDate) {
        query[field] = query[field] || {};
        query[field]['$lte'] = endDate;
      }
      
      return await this.find(query);
    } catch (error) {
      this.logger.error(`日期范围查询失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 分组统计
   * 简化版的分组统计，避免使用复杂的聚合管道
   * @param {String|Array} groupFields - 分组字段或字段数组
   * @param {Object} options - 选项，包括:
   *   - countField: 计数字段，默认为 null，表示计数所有记录
   *   - sumField: 求和字段，默认为 null
   *   - avgField: 平均值字段，默认为 null
   *   - query: 筛选条件，默认为 {}
   * @returns {Promise<Array>} 分组统计结果
   */
  async groupStatistics(groupFields, options = {}) {
    try {
      const { countField = null, sumField = null, avgField = null, query = {} } = options;
      this.logger.debug(`分组统计: ${this.model.name || '未知模型'}, 分组字段: ${JSON.stringify(groupFields)}`);
      
      // 获取所有记录
      const records = await this.find(query);
      const results = new Map();
      
      // 处理单字段或多字段分组
      const fields = Array.isArray(groupFields) ? groupFields : [groupFields];
      
      // 对记录进行内存分组
      for (const record of records) {
        // 构建分组键
        const groupValues = fields.map(field => record[field]);
        const groupKey = JSON.stringify(groupValues);
        
        // 初始化分组结果
        if (!results.has(groupKey)) {
          results.set(groupKey, {
            _id: fields.length === 1 ? groupValues[0] : groupValues.reduce((obj, value, index) => {
              obj[fields[index]] = value;
              return obj;
            }, {}),
            count: 0,
            sum: 0,
            avg: 0
          });
        }
        
        const groupResult = results.get(groupKey);
        
        // 计数
        groupResult.count++;
        
        // 求和
        if (sumField && record[sumField] !== undefined) {
          const value = parseFloat(record[sumField]) || 0;
          groupResult.sum += value;
        }
        
        // 平均值在所有记录处理完后计算
      }
      
      // 计算平均值并转换为数组
      const resultArray = Array.from(results.values()).map(result => {
        if (sumField && result.count > 0) {
          result.avg = result.sum / result.count;
        }
        return result;
      });
      
      return resultArray;
    } catch (error) {
      this.logger.error(`分组统计失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DataAccess; 