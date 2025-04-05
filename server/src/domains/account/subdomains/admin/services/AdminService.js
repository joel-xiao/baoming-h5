const bcrypt = require('bcrypt');
const appConfig = require('../../../../../config/app');
const ModelFactory = require('../../../../../infrastructure/database/connectors/ModelFactory');
const Admin = require('../../../models/Admin');
const Registration = require('../../../../registration/models/Registration');
const Payment = require('../../../../payment/models/Payment');
const logger = require('../../../../../infrastructure/utils/helper/Logger');
const { ExportService } = require('../../../../../infrastructure/utils/export/ExportService');
const { ADMIN_ROLE, ADMIN_STATUS } = Admin;

/**
 * 管理员服务类
 * 处理管理员管理、数据导出、统计等功能
 */
class AdminService {
  /**
   * 获取所有注册记录
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async getAllRegistrations(options) {
    try {
      const { status, page = 1, limit = 20, search, sort = 'createdAt', order = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      // 构建查询条件
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { teamName: { $regex: search, $options: 'i' } },
          { 'leader.name': { $regex: search, $options: 'i' } },
          { 'leader.phone': { $regex: search, $options: 'i' } },
          { 'leader.email': { $regex: search, $options: 'i' } }
        ];
      }
      
      // 获取Registration模型
      const registrationModel = ModelFactory.getModel(Registration);
      
      // 查询记录
      const registrations = await registrationModel.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // 获取总记录数
      const total = await registrationModel.countDocuments(query);
      
      return {
        success: true,
        data: {
          registrations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: '获取注册记录成功'
      };
    } catch (error) {
      logger.error(`获取注册记录错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '获取注册记录时发生错误',
        error
      };
    }
  }

  /**
   * 获取统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getStats() {
    try {
      // 获取模型
      const registrationModel = ModelFactory.getModel(Registration);
      const paymentModel = ModelFactory.getModel(Payment);
      
      // 获取注册数量统计
      const registrationStats = await registrationModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // 获取注册总数
      const totalRegistrations = await registrationModel.countDocuments();
      
      // 获取支付统计
      const paymentStats = await paymentModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]);
      
      // 获取支付总数和总金额
      const totalPayments = await paymentModel.countDocuments();
      const totalAmount = await paymentModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      // 获取今日注册数量
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRegistrations = await registrationModel.countDocuments({
        createdAt: { $gte: today }
      });
      
      // 获取今日支付数量和金额
      const todayPayments = await paymentModel.countDocuments({
        createdAt: { $gte: today }
      });
      const todayAmount = await paymentModel.aggregate([
        {
          $match: { createdAt: { $gte: today } }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      return {
        success: true,
        data: {
          registration: {
            total: totalRegistrations,
            today: todayRegistrations,
            statuses: registrationStats.reduce((acc, curr) => {
              acc[curr._id] = curr.count;
              return acc;
            }, {})
          },
          payment: {
            total: totalPayments,
            today: todayPayments,
            amount: totalAmount.length > 0 ? totalAmount[0].total : 0,
            todayAmount: todayAmount.length > 0 ? todayAmount[0].total : 0,
            statuses: paymentStats.reduce((acc, curr) => {
              acc[curr._id] = {
                count: curr.count,
                amount: curr.amount
              };
              return acc;
            }, {})
          }
        },
        message: '获取统计数据成功'
      };
    } catch (error) {
      logger.error(`获取统计数据错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '获取统计数据时发生错误',
        error
      };
    }
  }

  /**
   * 导出注册数据
   * @param {Object} options 导出选项
   * @returns {Promise<Object>} 导出结果
   */
  async exportRegistrations(options) {
    try {
      const { format = 'xlsx', status } = options;
      
      // 构建查询条件
      const query = {};
      if (status) query.status = status;
      
      // 获取Registration模型
      const registrationModel = ModelFactory.getModel(Registration);
      
      // 查询记录
      const registrations = await registrationModel.find(query).sort({ createdAt: -1 });
      
      // 使用导出服务
      const exportService = new ExportService();
      const exportResult = await exportService.exportRegistrations(registrations, format);
      
      logger.info(`导出注册数据成功, 格式: ${format}, 记录数: ${registrations.length}`);
      
      return {
        success: true,
        data: exportResult,
        message: '导出注册数据成功'
      };
    } catch (error) {
      logger.error(`导出注册数据错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '导出注册数据时发生错误',
        error
      };
    }
  }

  /**
   * 导出支付数据
   * @param {Object} options 导出选项
   * @returns {Promise<Object>} 导出结果
   */
  async exportPayments(options) {
    try {
      const { format = 'xlsx', status } = options;
      
      // 构建查询条件
      const query = {};
      if (status) query.status = status;
      
      // 获取Payment模型
      const paymentModel = ModelFactory.getModel(Payment);
      
      // 查询记录
      const payments = await paymentModel.find(query).sort({ createdAt: -1 });
      
      // 使用导出服务
      const exportService = new ExportService();
      const exportResult = await exportService.exportPayments(payments, format);
      
      logger.info(`导出支付数据成功, 格式: ${format}, 记录数: ${payments.length}`);
      
      return {
        success: true,
        data: exportResult,
        message: '导出支付数据成功'
      };
    } catch (error) {
      logger.error(`导出支付数据错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '导出支付数据时发生错误',
        error
      };
    }
  }

  /**
   * 获取所有管理员用户
   * @returns {Promise<Object>} 管理员用户列表
   */
  async getAllUsers() {
    try {
      // 获取Admin模型
      const adminModel = ModelFactory.getModel(Admin);
      
      // 查询用户
      const users = await adminModel.find().select('-password').sort({ createdAt: -1 });
      
      return {
        success: true,
        data: users,
        message: '获取管理员用户成功'
      };
    } catch (error) {
      logger.error(`获取管理员用户错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '获取管理员用户时发生错误',
        error
      };
    }
  }

  /**
   * 创建管理员用户
   * @param {Object} userData 用户数据
   * @param {string} creatorId 创建者ID
   * @returns {Promise<Object>} 创建结果
   */
  async createUser(userData, creatorId) {
    try {
      const { username, password, email, name, role = ADMIN_ROLE.ADMIN, status = ADMIN_STATUS.ACTIVE } = userData;
      
      // 获取Admin模型
      const adminModel = ModelFactory.getModel(Admin);
      
      // 检查用户名是否存在
      const existingUser = await adminModel.findOne({ username });
      
      if (existingUser) {
        return {
          success: false,
          status: 400,
          message: '用户名已存在'
        };
      }
      
      // 检查邮箱是否存在
      if (email) {
        const existingEmail = await adminModel.findOne({ email });
        
        if (existingEmail) {
          return {
            success: false,
            status: 400,
            message: '邮箱已存在'
          };
        }
      }
      
      // 哈希密码
      const salt = await bcrypt.genSalt(parseInt(appConfig.security.bcryptRounds));
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 创建用户
      const newUser = await adminModel.create({
        username,
        password: hashedPassword,
        email,
        name,
        role,
        status,
        createdBy: creatorId
      });
      
      // 移除密码
      const user = newUser.toObject();
      delete user.password;
      
      logger.info(`管理员创建成功: ${username}`);
      
      return {
        success: true,
        status: 201,
        data: user,
        message: '管理员创建成功'
      };
    } catch (error) {
      logger.error(`创建管理员错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '创建管理员时发生错误',
        error
      };
    }
  }

  /**
   * 更新管理员用户
   * @param {string} id 用户ID
   * @param {Object} userData 用户数据
   * @param {string} updaterId 更新者ID
   * @returns {Promise<Object>} 更新结果
   */
  async updateUser(id, userData, updaterId) {
    try {
      const { email, name, role, status } = userData;
      
      // 获取Admin模型
      const adminModel = ModelFactory.getModel(Admin);
      
      // 超级管理员不能被降级
      if (role && role !== ADMIN_ROLE.SUPER_ADMIN) {
        // 查找用户
        const user = await adminModel.findById(id);
        
        if (user && user.role === ADMIN_ROLE.SUPER_ADMIN) {
          return {
            success: false,
            status: 403,
            message: '不能降级超级管理员'
          };
        }
      }
      
      // 更新用户
      const updatedUser = await adminModel.findByIdAndUpdate(
        id,
        { email, name, role, status, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return {
          success: false,
          status: 404,
          message: '用户不存在'
        };
      }
      
      // 获取更新者信息
      const updater = await adminModel.findById(updaterId);
      logger.info(`管理员更新成功: ${updatedUser.username}, 更新者: ${updater ? updater.username : updaterId}`);
      
      return {
        success: true,
        data: updatedUser,
        message: '管理员更新成功'
      };
    } catch (error) {
      logger.error(`更新管理员错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '更新管理员时发生错误',
        error
      };
    }
  }

  /**
   * 删除管理员用户
   * @param {string} id 用户ID
   * @param {string} deleterId 删除者ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteUser(id, deleterId) {
    try {
      // 获取Admin模型
      const adminModel = ModelFactory.getModel(Admin);
      
      // 查找用户
      const user = await adminModel.findById(id);
      
      if (!user) {
        return {
          success: false,
          status: 404,
          message: '用户不存在'
        };
      }
      
      // 检查是否是超级管理员
      if (user.role === ADMIN_ROLE.SUPER_ADMIN) {
        return {
          success: false,
          status: 403,
          message: '不能删除超级管理员'
        };
      }
      
      // 检查是否删除自己
      if (user._id.toString() === deleterId.toString()) {
        return {
          success: false,
          status: 403,
          message: '不能删除当前登录用户'
        };
      }
      
      // 删除用户
      await adminModel.findByIdAndDelete(id);
      
      // 获取删除者信息
      const deleter = await adminModel.findById(deleterId);
      logger.info(`管理员删除成功: ${user.username}, 删除者: ${deleter ? deleter.username : deleterId}`);
      
      return {
        success: true,
        message: '管理员删除成功'
      };
    } catch (error) {
      logger.error(`删除管理员错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '删除管理员时发生错误',
        error
      };
    }
  }
}

// 导出服务实例
module.exports = new AdminService(); 