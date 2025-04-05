const { SchemaBuilder } = require('../../../infrastructure/utils/helper/SchemaBuilder');

/**
 * 浏览量统计数据字段定义
 */
const statsFields = {
  // 统计日期 (YYYY-MM-DD)
  date: {
    type: 'string',
    required: true
  },
  
  // 浏览次数
  count: {
    type: 'number',
    default: 0
  },
  
  // IP记录(可选，用于统计独立访客)
  ipList: {
    type: 'array'
  }
};

// 实例方法
const methods = {};

/**
 * 静态方法
 */
const statics = {
  /**
   * 记录新的浏览量
   * @param {Object} viewData - 浏览数据，包含IP等信息
   * @returns {Promise} 创建结果
   */
  recordView: async function(viewData = {}) {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 尝试查找今天的记录
    const existingRecord = await this.findOne({ date: dateString });
    
    if (existingRecord) {
      // 更新记录 - 增加计数
      const updateData = { 
        $inc: { count: 1 },
        $set: { updatedAt: new Date() }
      };
      
      // 如果提供了IP地址且不在列表中，则添加到ipList
      if (viewData.ip && existingRecord.ipList && !existingRecord.ipList.includes(viewData.ip)) {
        updateData.$push = { ipList: viewData.ip };
      }
      
      return await this.updateOne(
        { _id: existingRecord._id },
        updateData
      );
    } else {
      // 创建新记录
      const newRecord = {
        date: dateString,
        count: 1,
        ipList: viewData.ip ? [viewData.ip] : []
      };
      
      return await this.create(newRecord);
    }
  },
  
  /**
   * 获取总浏览量
   * @returns {Promise<number>} 总浏览量
   */
  getTotalViews: async function() {
    const result = await this.aggregate([
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);
    
    return result.length > 0 ? result[0].total : 0;
  },
  
  /**
   * 获取今日浏览量
   * @returns {Promise<number>} 今日浏览量
   */
  getTodayViews: async function() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const record = await this.findOne({ date: dateString });
    
    return record ? record.count : 0;
  }
};

// 创建统计数据模型
const statsModel = {
  name: 'Stats',
  fields: statsFields,
  options: {
    methods,
    statics
  }
};

module.exports = statsModel; 