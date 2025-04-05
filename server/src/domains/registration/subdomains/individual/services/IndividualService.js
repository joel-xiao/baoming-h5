const ModelFactory = require('../../../../../infrastructure/database/connectors/ModelFactory');
const Registration = require('../../../models/Registration');
const DataAccess = require('../../../../../infrastructure/database/connectors/DataAccess');
const logger = require('../../../../../infrastructure/utils/helper/Logger');
const { sendEmail } = require('../../../../../infrastructure/communication/email/EmailService');
const { REGISTRATION_STATUS } = Registration;
const IDGenerator = require('../../../../../infrastructure/utils/helper/IDGenerator');
const RegistrationService = require('../../../services/RegistrationService');

/**
 * 个人报名服务
 * 负责处理个人报名相关的业务逻辑
 */
class IndividualService {
  constructor() {
    this.registrationService = new RegistrationService();
  }

  /**
   * 创建个人报名
   * @param {Object} individualData - 个人报名数据
   * @returns {Promise<Object>} 创建的报名记录
   */
  async createIndividualRegistration(individualData) {
    try {
      const {
        name,
        phone,
        email,
        gender = 'male',
        openid,
        eventId = '6425abc1234567890abcdef',
        categoryId = '6425abc1234567890abcdef',
        ...additionalInfo
      } = individualData;

      // 验证必填参数
      if (!name || !phone) {
        throw new Error('姓名和手机号为必填项');
      }

      // 检查手机号是否已存在
      const existingRegistration = await this.registrationService.findRegistrations({ 'leader.phone': phone });
      if (existingRegistration && existingRegistration.length > 0) {
        throw new Error('该手机号已被注册');
      }

      // 生成唯一的订单号
      const orderNo = IDGenerator.generateOrderId();

      // 构建个人报名数据
      const registrationData = {
        teamName: name, // 个人报名使用姓名作为团队名
        leader: {
          name,
          phone,
          email,
          gender,
          openid,
        },
        members: [], // 个人报名没有成员
        additionalInfo,
        eventId,
        categoryId,
        orderNo,
        isIndividual: true, // 标记为个人报名
        status: REGISTRATION_STATUS.PENDING,
        createdAt: new Date()
      };

      // 创建报名记录
      const registration = await this.registrationService.createRegistration(registrationData);

      // 如果提供了邮箱，发送确认邮件
      if (email) {
        try {
          await sendEmail({
            to: email,
            subject: '【报名系统】个人报名确认',
            text: `尊敬的${name}，您已成功完成个人报名。`,
            html: `
              <p>尊敬的${name}，</p>
              <p>您已成功完成个人报名。</p>
              <p>报名信息:</p>
              <ul>
                <li>姓名: ${name}</li>
                <li>手机: ${phone}</li>
                <li>订单号: ${orderNo}</li>
              </ul>
              <p>谢谢!</p>
              <p>报名系统</p>
            `
          });
          
          logger.info(`个人报名确认邮件已发送: ${email}`);
        } catch (emailError) {
          logger.error(`发送个人报名确认邮件错误: ${emailError.message}`);
          // 不影响报名流程，继续处理
        }
      }

      logger.info(`个人报名已创建: ${registration._id}, 姓名: ${name}`);
      
      return registration;
    } catch (error) {
      logger.error(`创建个人报名错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取个人报名记录
   * @param {String} id - 报名ID
   * @returns {Promise<Object>} 报名记录
   */
  async getIndividualRegistration(id) {
    try {
      const registration = await this.registrationService.getRegistrationById(id);
      
      if (!registration || !registration.isIndividual) {
        throw new Error('个人报名记录不存在');
      }
      
      return registration;
    } catch (error) {
      logger.error(`获取个人报名记录错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新个人报名记录
   * @param {String} id - 报名ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的报名记录
   */
  async updateIndividualRegistration(id, updateData) {
    try {
      // 获取报名记录
      const registration = await this.registrationService.getRegistrationById(id);
      
      if (!registration || !registration.isIndividual) {
        throw new Error('个人报名记录不存在');
      }
      
      // 过滤敏感字段
      const { status, paymentStatus, paidAmount, paidAt, ...safeUpdateData } = updateData;
      
      // 构建更新数据
      const leaderUpdates = {};
      for (const [key, value] of Object.entries(safeUpdateData)) {
        if (['name', 'phone', 'email', 'gender'].includes(key)) {
          leaderUpdates[`leader.${key}`] = value;
        }
      }
      
      // 合并其他更新数据
      const mergedUpdateData = {
        ...leaderUpdates,
        additionalInfo: safeUpdateData.additionalInfo,
        updatedAt: new Date()
      };
      
      // 更新报名记录
      const updatedRegistration = await this.registrationService.updateRegistration(id, mergedUpdateData);
      
      logger.info(`个人报名已更新: ${id}`);
      
      return updatedRegistration;
    } catch (error) {
      logger.error(`更新个人报名记录错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查询个人报名列表
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 报名记录列表
   */
  async findIndividualRegistrations(query = {}, options = {}) {
    try {
      // 添加个人报名标记
      const individualQuery = {
        ...query,
        isIndividual: true
      };
      
      return await this.registrationService.findRegistrations(individualQuery, options);
    } catch (error) {
      logger.error(`查询个人报名列表错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 分页查询个人报名列表
   * @param {Object} query - 查询条件
   * @param {Number} page - 页码
   * @param {Number} limit - 每页记录数
   * @param {Object} sort - 排序方式
   * @returns {Promise<Object>} 分页结果
   */
  async paginateIndividualRegistrations(query = {}, page = 1, limit = 10, sort = { createdAt: -1 }) {
    try {
      // 添加个人报名标记
      const individualQuery = {
        ...query,
        isIndividual: true
      };
      
      return await this.registrationService.paginateRegistrations(individualQuery, page, limit, sort);
    } catch (error) {
      logger.error(`分页查询个人报名列表错误: ${error.message}`);
      throw error;
    }
  }
}

// 创建服务实例并导出
const individualService = new IndividualService();
module.exports = individualService; 