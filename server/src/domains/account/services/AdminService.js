const bcrypt = require('bcrypt');
const BaseService = require('../../BaseService');
const container = require('@common/di/Container');
const Admin = require('../models/Admin');
const { ADMIN_ROLE, ADMIN_STATUS } = Admin;

/**
 * 管理员服务类
 * 处理管理员的增删改查等功能
 */
class AdminService extends BaseService {
  /**
   * 初始化管理员服务
   */
  init() {
    // 获取模型工厂
    this.modelFactory = container.resolve('modelFactory');
    
    // 获取管理员仓库
    this.adminRepo = this.modelFactory.getRepository(Admin, 'account');
    
    // 保留模型引用以兼容现有代码
    this.adminModel = this.adminRepo.model;
  }

  /**
   * 获取数据访问对象
   * @returns {Object} 数据访问对象
   */
  getDataAccess() {
    return this.adminRepo;
  }

  /**
   * 获取所有管理员用户
   * @returns {Promise<Object>} 查询结果
   */
  async getAllUsers() {
    try {
      // 查询所有管理员，不返回密码字段
      const admins = await this.adminModel.find().select('-password').sort({ createdAt: -1 });
      
      return this.successResponse(admins, '获取管理员列表成功');
    } catch (error) {
      this.logError(`获取管理员列表错误: ${error.message}`, error);
      return this.errorResponse('获取管理员列表时发生错误', 500);
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
      const { username, password, name, email, phone, role } = userData;
      
      // 验证必填字段
      const requiredFields = ['username', 'password', 'name'];
      const validationResult = this.validateRequired(userData, requiredFields);
      
      if (validationResult) {
        return validationResult;
      }
      
      // 检查用户名是否存在
      const existingUser = await this.adminModel.findOne({ username });
      
      if (existingUser) {
        return this.errorResponse('用户名已存在', 400);
      }
      
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 创建新管理员
      const newUser = await this.adminModel.create({
        username,
        password: hashedPassword,
        name,
        email,
        phone,
        role: role || ADMIN_ROLE.EDITOR,
        status: ADMIN_STATUS.ACTIVE
      });
      
      // 移除密码字段
      const userData = newUser.toObject();
      delete userData.password;
      
      this.logInfo(`管理员创建成功: ${username}`);
      
      return this.successResponse(userData, '管理员创建成功', 201);
    } catch (error) {
      this.logError(`创建管理员错误: ${error.message}`, error);
      return this.errorResponse('创建管理员时发生错误', 500);
    }
  }

  /**
   * 更新管理员用户
   * @param {string} userId 用户ID
   * @param {Object} updateData 更新数据
   * @param {string} updaterId 更新者ID
   * @returns {Promise<Object>} 更新结果
   */
  async updateUser(userId, updateData, updaterId) {
    try {
      // 查找用户
      const user = await this.adminModel.findById(userId);
      
      if (!user) {
        return this.errorResponse('管理员不存在', 404);
      }
      
      // 更新字段
      if (updateData.name) user.name = updateData.name;
      if (updateData.email) user.email = updateData.email;
      if (updateData.phone) user.phone = updateData.phone;
      if (updateData.role) user.role = updateData.role;
      if (updateData.status) user.status = updateData.status;
      
      // 保存更新
      await user.save();
      
      this.logInfo(`管理员更新成功: ${user.username}`);
      
      return this.successResponse(user, '管理员更新成功');
    } catch (error) {
      this.logError(`更新管理员错误: ${error.message}`, error);
      return this.errorResponse('更新管理员时发生错误', 500);
    }
  }

  /**
   * 删除管理员用户
   * @param {string} userId 用户ID
   * @param {string} deleterId 删除者ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteUser(userId, deleterId) {
    try {
      // 查找用户
      const user = await this.adminModel.findById(userId);
      
      if (!user) {
        return this.errorResponse('管理员不存在', 404);
      }
      
      // 检查是否删除自己
      if (userId === deleterId) {
        return this.errorResponse('不能删除当前登录用户', 400);
      }
      
      // 删除用户
      await user.remove();
      
      this.logInfo(`管理员删除成功: ${user.username}`);
      
      return this.successResponse(null, '管理员删除成功');
    } catch (error) {
      this.logError(`删除管理员错误: ${error.message}`, error);
      return this.errorResponse('删除管理员时发生错误', 500);
    }
  }
}

// 创建单例实例
const adminService = new AdminService();

// 导出服务实例
module.exports = adminService; 