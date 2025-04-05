const bcrypt = require('bcrypt');
const appConfig = require('@config/app');
const BaseService = require('@domains/services/BaseService');
const container = require('@common/di/Container');
const Admin = require('@domains/account/models/Admin');
const Registration = require('@domains/registration/models/Registration');
const Payment = require('@domains/payment/models/Payment');
const { ExportService } = require('@utils/export/ExportService');
const { ADMIN_ROLE, ADMIN_STATUS } = Admin;

/**
 * 管理员服务类
 * 处理管理员管理、数据导出、统计等功能
 */
class AdminService extends BaseService {
  /**
   * 初始化管理员服务
   */
  init() {
    // 获取模型工厂
    this.modelFactory = container.resolve('modelFactory');
    
    // 获取仓库
    this.adminRepo = this.modelFactory.getRepository(Admin, 'account');
    this.registrationRepo = this.modelFactory.getRepository(Registration, 'registration');
    this.paymentRepo = this.modelFactory.getRepository(Payment, 'payment');
    
    // 保留模型引用以兼容现有代码
    this.adminModel = this.adminRepo.model;
    this.registrationModel = this.registrationRepo.model;
    this.paymentModel = this.paymentRepo.model;
  }

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
      
      // 查询记录
      const registrations = await this.registrationModel.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // 获取总记录数
      const total = await this.registrationModel.countDocuments(query);
      
      return this.successResponse({
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, '获取注册记录成功');
    } catch (error) {
      this.logError(`获取注册记录错误: ${error.message}`, error);
      return this.errorResponse('获取注册记录时发生错误', 500, error);
    }
  }

  /**
   * 获取统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getStats() {
    try {
      // 使用仓库的简化方法替代聚合查询
      
      // 获取按状态分组的注册统计
      const registrationStats = await this.registrationRepo.groupStatistics('status');
      
      // 获取注册总数
      const totalRegistrations = await this.registrationRepo.count();
      
      // 获取按状态分组的支付统计和金额
      const paymentStats = await this.paymentRepo.groupStatistics('status', {
        sumField: 'amount'
      });
      
      // 获取支付总数
      const totalPayments = await this.paymentRepo.count();
      
      // 计算总金额
      let totalAmount = 0;
      paymentStats.forEach(stat => {
        totalAmount += stat.sum || 0;
      });
      
      // 获取今日的记录
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 获取今日注册数量
      const todayRegistrations = await this.registrationRepo.findByDateRange('createdAt', today);
      
      // 获取今日支付记录和金额
      const todayPayments = await this.paymentRepo.findByDateRange('createdAt', today);
      
      // 计算今日支付金额
      let todayAmountValue = 0;
      todayPayments.forEach(payment => {
        if (payment.amount) {
          todayAmountValue += payment.amount;
        }
      });
      
      // 转换为期望的响应格式
      const registrationStatusMap = {};
      registrationStats.forEach(stat => {
        if (stat._id) {
          registrationStatusMap[stat._id] = stat.count;
        }
      });
      
      const paymentStatusMap = {};
      paymentStats.forEach(stat => {
        if (stat._id) {
          paymentStatusMap[stat._id] = {
            count: stat.count,
            amount: stat.sum || 0
          };
        }
      });
      
      return this.successResponse({
        registration: {
          total: totalRegistrations,
          today: todayRegistrations.length,
          statuses: registrationStatusMap
        },
        payment: {
          total: totalPayments,
          today: todayPayments.length,
          amount: totalAmount,
          todayAmount: todayAmountValue,
          statuses: paymentStatusMap
        }
      }, '获取统计数据成功');
    } catch (error) {
      this.logError(`获取统计数据错误: ${error.message}`, error);
      return this.errorResponse('获取统计数据时发生错误', 500, error);
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
      
      // 查询记录
      const registrations = await this.registrationModel.find(query).sort({ createdAt: -1 });
      
      // 使用导出服务
      const exportService = new ExportService();
      const exportResult = await exportService.exportRegistrations(registrations, format);
      
      this.logInfo(`导出注册数据成功, 格式: ${format}, 记录数: ${registrations.length}`);
      
      return this.successResponse(exportResult, '导出注册数据成功');
    } catch (error) {
      this.logError(`导出注册数据错误: ${error.message}`, error);
      return this.errorResponse('导出注册数据时发生错误', 500, error);
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
      
      // 查询记录
      const payments = await this.paymentModel.find(query).sort({ createdAt: -1 });
      
      // 使用导出服务
      const exportService = new ExportService();
      const exportResult = await exportService.exportPayments(payments, format);
      
      this.logInfo(`导出支付数据成功, 格式: ${format}, 记录数: ${payments.length}`);
      
      return this.successResponse(exportResult, '导出支付数据成功');
    } catch (error) {
      this.logError(`导出支付数据错误: ${error.message}`, error);
      return this.errorResponse('导出支付数据时发生错误', 500, error);
    }
  }

  /**
   * 获取所有管理员用户
   * @returns {Promise<Object>} 管理员用户列表
   */
  async getAllUsers() {
    try {
      // 查询用户
      const users = await this.adminModel.find().select('-password').sort({ createdAt: -1 });
      
      return this.successResponse(users, '获取管理员用户成功');
    } catch (error) {
      this.logError(`获取管理员用户错误: ${error.message}`, error);
      return this.errorResponse('获取管理员用户时发生错误', 500, error);
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
      
      // 检查用户名是否存在
      const existingUser = await this.adminModel.findOne({ username });
      
      if (existingUser) {
        return this.errorResponse('用户名已存在', 400);
      }
      
      // 检查邮箱是否存在
      if (email) {
        const existingEmail = await this.adminModel.findOne({ email });
        
        if (existingEmail) {
          return this.errorResponse('邮箱已存在', 400);
        }
      }
      
      // 哈希密码
      const salt = await bcrypt.genSalt(parseInt(appConfig.security.bcryptRounds));
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 创建用户
      const newUser = await this.adminModel.create({
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
      
      this.logInfo(`管理员创建成功: ${username}`);
      
      return this.successResponse(user, '管理员创建成功', 201);
    } catch (error) {
      this.logError(`创建管理员错误: ${error.message}`, error);
      return this.errorResponse('创建管理员时发生错误', 500, error);
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
      
      // 超级管理员不能被降级
      if (role && role !== ADMIN_ROLE.SUPER_ADMIN) {
        // 查找用户
        const user = await this.adminModel.findById(id);
        
        if (user && user.role === ADMIN_ROLE.SUPER_ADMIN) {
          return this.errorResponse('不能降级超级管理员', 403);
        }
      }
      
      // 更新用户
      const updatedUser = await this.adminModel.findByIdAndUpdate(
        id,
        { email, name, role, status, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return this.errorResponse('用户不存在', 404);
      }
      
      // 获取更新者信息
      const updater = await this.adminModel.findById(updaterId);
      this.logInfo(`管理员更新成功: ${updatedUser.username}, 更新者: ${updater ? updater.username : updaterId}`);
      
      return this.successResponse(updatedUser, '管理员更新成功');
    } catch (error) {
      this.logError(`更新管理员错误: ${error.message}`, error);
      return this.errorResponse('更新管理员时发生错误', 500, error);
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
      // 查找用户
      const user = await this.adminModel.findById(id);
      
      if (!user) {
        return this.errorResponse('用户不存在', 404);
      }
      
      // 检查是否是超级管理员
      if (user.role === ADMIN_ROLE.SUPER_ADMIN) {
        return this.errorResponse('不能删除超级管理员', 403);
      }
      
      // 检查是否删除自己
      if (user._id.toString() === deleterId.toString()) {
        return this.errorResponse('不能删除当前登录用户', 403);
      }
      
      // 删除用户
      await this.adminModel.findByIdAndDelete(id);
      
      // 获取删除者信息
      const deleter = await this.adminModel.findById(deleterId);
      this.logInfo(`管理员删除成功: ${user.username}, 删除者: ${deleter ? deleter.username : deleterId}`);
      
      return this.successResponse(null, '管理员删除成功');
    } catch (error) {
      this.logError(`删除管理员错误: ${error.message}`, error);
      return this.errorResponse('删除管理员时发生错误', 500, error);
    }
  }
}

// 创建并导出单例
const adminService = new AdminService();
module.exports = adminService; 