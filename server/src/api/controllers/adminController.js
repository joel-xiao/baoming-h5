const bcrypt = require('bcrypt');
const appConfig = require('../../config/app');
const ModelFactory = require('../../core/db/ModelFactory');
const Admin = require('../../core/models/Admin');
const Registration = require('../../core/models/Registration');
const Payment = require('../../core/models/Payment');
const logger = require('../../core/utils/Logger');
const { ExportService } = require('../../core/services/ExportService');
const { ADMIN_ROLE, ADMIN_STATUS } = require('../../core/constants');

/**
 * 获取所有注册记录
 * @route GET /api/admin/registrations
 * @access 私有 管理员
 */
const getAllRegistrations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, sort = 'createdAt', order = 'desc' } = req.query;
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
    
    res.status(200).json({
      success: true,
      message: '获取注册记录成功',
      data: {
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`获取注册记录错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取注册记录时发生错误'
    });
  }
};

/**
 * 获取统计数据
 * @route GET /api/admin/stats
 * @access 私有 管理员
 */
const getStats = async (req, res) => {
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
    
    res.status(200).json({
      success: true,
      message: '获取统计数据成功',
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
      }
    });
  } catch (error) {
    logger.error(`获取统计数据错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取统计数据时发生错误'
    });
  }
};

/**
 * 导出注册数据
 * @route GET /api/admin/export/registrations
 * @access 私有 管理员
 */
const exportRegistrations = async (req, res) => {
  try {
    const { format = 'xlsx', status } = req.query;
    
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
    
    // 设置响应头
    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${exportResult.filename}`);
    
    // 发送文件
    res.send(exportResult.data);
    
    logger.info(`导出注册数据成功, 格式: ${format}, 记录数: ${registrations.length}`);
  } catch (error) {
    logger.error(`导出注册数据错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '导出注册数据时发生错误'
    });
  }
};

/**
 * 导出支付数据
 * @route GET /api/admin/export/payments
 * @access 私有 管理员
 */
const exportPayments = async (req, res) => {
  try {
    const { format = 'xlsx', status } = req.query;
    
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
    
    // 设置响应头
    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${exportResult.filename}`);
    
    // 发送文件
    res.send(exportResult.data);
    
    logger.info(`导出支付数据成功, 格式: ${format}, 记录数: ${payments.length}`);
  } catch (error) {
    logger.error(`导出支付数据错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '导出支付数据时发生错误'
    });
  }
};

/**
 * 获取所有管理员用户
 * @route GET /api/admin/users
 * @access 私有 管理员
 */
const getAllUsers = async (req, res) => {
  try {
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查询用户
    const users = await adminModel.find().select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: '获取管理员用户成功',
      data: users
    });
  } catch (error) {
    logger.error(`获取管理员用户错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取管理员用户时发生错误'
    });
  }
};

/**
 * 创建管理员用户
 * @route POST /api/admin/users
 * @access 私有 超级管理员
 */
const createUser = async (req, res) => {
  try {
    const { username, password, email, name, role = ADMIN_ROLE.ADMIN, status = ADMIN_STATUS.ACTIVE } = req.body;
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 检查用户名是否存在
    const existingUser = await adminModel.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 检查邮箱是否存在
    if (email) {
      const existingEmail = await adminModel.findOne({ email });
      
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        });
      }
    }
    
    // 哈希密码
    const salt = await bcrypt.genSalt(parseInt(appConfig.security.bcrypt.rounds));
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建用户
    const newUser = await adminModel.create({
      username,
      password: hashedPassword,
      email,
      name,
      role,
      status,
      createdBy: req.user._id
    });
    
    // 移除密码
    const user = newUser.toObject();
    delete user.password;
    
    logger.info(`管理员创建成功: ${username}, 创建者: ${req.user.username}`);
    
    res.status(201).json({
      success: true,
      message: '管理员创建成功',
      data: user
    });
  } catch (error) {
    logger.error(`创建管理员错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建管理员时发生错误'
    });
  }
};

/**
 * 更新管理员用户
 * @route PUT /api/admin/users/:id
 * @access 私有 超级管理员
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, status } = req.body;
    
    // 超级管理员不能被降级
    if (role && role !== ADMIN_ROLE.SUPER_ADMIN) {
      // 获取Admin模型
      const adminModel = ModelFactory.getModel(Admin);
      
      // 查找用户
      const user = await adminModel.findById(id);
      
      if (user && user.role === ADMIN_ROLE.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: '不能降级超级管理员'
        });
      }
    }
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 更新用户
    const updatedUser = await adminModel.findByIdAndUpdate(
      id,
      { email, name, role, status, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    logger.info(`管理员更新成功: ${updatedUser.username}, 更新者: ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: '管理员更新成功',
      data: updatedUser
    });
  } catch (error) {
    logger.error(`更新管理员错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新管理员时发生错误'
    });
  }
};

/**
 * 删除管理员用户
 * @route DELETE /api/admin/users/:id
 * @access 私有 超级管理员
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取Admin模型
    const adminModel = ModelFactory.getModel(Admin);
    
    // 查找用户
    const user = await adminModel.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查是否是超级管理员
    if (user.role === ADMIN_ROLE.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: '不能删除超级管理员'
      });
    }
    
    // 检查是否删除自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '不能删除当前登录用户'
      });
    }
    
    // 删除用户
    await adminModel.findByIdAndDelete(id);
    
    logger.info(`管理员删除成功: ${user.username}, 删除者: ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: '管理员删除成功'
    });
  } catch (error) {
    logger.error(`删除管理员错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '删除管理员时发生错误'
    });
  }
};

module.exports = {
  getAllRegistrations,
  getStats,
  exportRegistrations,
  exportPayments,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
}; 