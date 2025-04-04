const ModelFactory = require('../db/ModelFactory');
const Registration = require('../models/Registration');
const DataAccess = require('../db/DataAccess');
const logger = require('../utils/Logger');

/**
 * 报名服务
 * 负责处理报名相关的业务逻辑
 */
class RegistrationService {
  constructor() {
    // 获取适用于当前数据库类型的模型实现
    this.registrationModel = ModelFactory.getModel(Registration);
    // 创建数据访问对象
    this.dataAccess = new DataAccess(this.registrationModel);
  }

  /**
   * 创建新报名
   * @param {Object} registrationData - 报名数据
   * @returns {Promise<Object>} 创建的报名记录
   */
  async createRegistration(registrationData) {
    try {
      logger.info(`创建新报名：${registrationData.name}`);
      return await this.dataAccess.create(registrationData);
    } catch (error) {
      logger.error(`创建报名失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查找单个报名记录
   * @param {String} id - 报名ID
   * @returns {Promise<Object>} 报名记录
   */
  async getRegistrationById(id) {
    try {
      return await this.dataAccess.findOne({ _id: id });
    } catch (error) {
      logger.error(`查找报名记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查找符合条件的报名记录
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项（排序、分页等）
   * @returns {Promise<Array>} 报名记录数组
   */
  async findRegistrations(query = {}, options = {}) {
    try {
      return await this.dataAccess.find(query, options);
    } catch (error) {
      logger.error(`查找报名记录列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 分页查询报名记录
   * @param {Object} query - 查询条件
   * @param {Number} page - 页码
   * @param {Number} limit - 每页记录数
   * @param {Object} sort - 排序方式
   * @returns {Promise<Object>} 分页结果
   */
  async paginateRegistrations(query = {}, page = 1, limit = 10, sort = { createdAt: -1 }) {
    try {
      return await this.dataAccess.paginate(query, page, limit, sort);
    } catch (error) {
      logger.error(`分页查询报名记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新报名记录
   * @param {String} id - 报名ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateRegistration(id, updateData) {
    try {
      logger.info(`更新报名记录: ${id}`);
      return await this.dataAccess.update({ _id: id }, updateData);
    } catch (error) {
      logger.error(`更新报名记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除报名记录
   * @param {String} id - 报名ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteRegistration(id) {
    try {
      logger.info(`删除报名记录: ${id}`);
      return await this.dataAccess.delete({ _id: id });
    } catch (error) {
      logger.error(`删除报名记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新报名支付状态
   * @param {String} id - 报名ID
   * @param {String} paymentStatus - 支付状态
   * @returns {Promise<Object>} 更新结果
   */
  async updatePaymentStatus(id, paymentStatus) {
    try {
      logger.info(`更新报名支付状态: ${id}, 状态: ${paymentStatus}`);
      return await this.dataAccess.update(
        { _id: id },
        { paymentStatus }
      );
    } catch (error) {
      logger.error(`更新报名支付状态失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 审核报名
   * @param {String} id - 报名ID
   * @param {String} status - 审核状态
   * @param {String} remarks - 备注
   * @returns {Promise<Object>} 更新结果
   */
  async reviewRegistration(id, status, remarks = '') {
    try {
      logger.info(`审核报名: ${id}, 状态: ${status}`);
      return await this.dataAccess.update(
        { _id: id },
        { status, remarks }
      );
    } catch (error) {
      logger.error(`审核报名失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 统计报名数据
   * @returns {Promise<Object>} 统计结果
   */
  async getStatistics() {
    try {
      // 获取总报名数
      const total = await this.dataAccess.count();
      
      // 获取不同状态的报名数量
      const [pending, approved, rejected] = await Promise.all([
        this.dataAccess.count({ status: '待审核' }),
        this.dataAccess.count({ status: '已通过' }),
        this.dataAccess.count({ status: '已拒绝' })
      ]);
      
      // 获取不同支付状态的报名数量
      const [unpaid, paid, refunded] = await Promise.all([
        this.dataAccess.count({ paymentStatus: '未支付' }),
        this.dataAccess.count({ paymentStatus: '已支付' }),
        this.dataAccess.count({ paymentStatus: '已退款' })
      ]);
      
      return {
        total,
        status: { pending, approved, rejected },
        payment: { unpaid, paid, refunded }
      };
    } catch (error) {
      logger.error(`统计报名数据失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RegistrationService; 