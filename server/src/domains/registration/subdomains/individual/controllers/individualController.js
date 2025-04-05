const logger = require('../../../../../infrastructure/utils/helper/Logger');
const ResponseUtil = require('../../../../../infrastructure/utils/helper/ResponseUtil');
const individualService = require('../services/IndividualService');

/**
 * 创建个人报名
 * @route POST /api/registration/individual
 * @access 公开
 */
const createIndividualRegistration = async (req, res) => {
  try {
    const individualData = req.body;
    
    // 使用服务创建个人报名
    const registration = await individualService.createIndividualRegistration(individualData);
    
    logger.info(`个人报名创建成功: ${registration._id}, 姓名: ${registration.leader.name}`);
    
    return ResponseUtil.success(res, '个人报名创建成功', {
      id: registration._id,
      name: registration.leader.name,
      orderNo: registration.orderNo,
      status: registration.status
    }, 201);
  } catch (error) {
    logger.error(`创建个人报名错误: ${error.message}`);
    if (error.message === '姓名和手机号为必填项' || error.message === '该手机号已被注册') {
      return ResponseUtil.error(res, error.message, 400);
    }
    return ResponseUtil.error(res, '创建个人报名时发生错误', 500);
  }
};

/**
 * 获取个人报名详情
 * @route GET /api/registration/individual/:id
 * @access 公开
 */
const getIndividualRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 使用服务获取个人报名
    const registration = await individualService.getIndividualRegistration(id);
    
    return ResponseUtil.success(res, '获取个人报名成功', registration, 200);
  } catch (error) {
    logger.error(`获取个人报名错误: ${error.message}`);
    if (error.message === '个人报名记录不存在') {
      return ResponseUtil.error(res, error.message, 404);
    }
    return ResponseUtil.error(res, '获取个人报名时发生错误', 500);
  }
};

/**
 * 更新个人报名信息
 * @route PUT /api/registration/individual/:id
 * @access 公开
 */
const updateIndividualRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 使用服务更新个人报名
    const registration = await individualService.updateIndividualRegistration(id, updateData);
    
    logger.info(`个人报名更新成功: ${id}`);
    
    return ResponseUtil.success(res, '更新个人报名成功', {
      id: registration._id,
      name: registration.leader.name,
      status: registration.status
    }, 200);
  } catch (error) {
    logger.error(`更新个人报名错误: ${error.message}`);
    if (error.message === '个人报名记录不存在') {
      return ResponseUtil.error(res, error.message, 404);
    }
    return ResponseUtil.error(res, '更新个人报名时发生错误', 500);
  }
};

/**
 * 获取个人报名列表
 * @route GET /api/registration/individual
 * @access 私有 管理员
 */
const getIndividualRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, fromDate, toDate } = req.query;
    
    // 构建查询条件
    const query = {};
    if (status) {
      query.status = status;
    }
    
    // 添加日期范围过滤
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }
    
    // 使用服务分页查询个人报名
    const result = await individualService.paginateIndividualRegistrations(
      query,
      parseInt(page),
      parseInt(limit),
      { createdAt: -1 }
    );
    
    return ResponseUtil.success(res, '获取个人报名列表成功', result, 200);
  } catch (error) {
    logger.error(`获取个人报名列表错误: ${error.message}`);
    return ResponseUtil.error(res, '获取个人报名列表时发生错误', 500);
  }
};

/**
 * 根据手机号查询个人报名
 * @route GET /api/registration/individual/phone/:phone
 * @access 公开
 */
const getIndividualByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    
    // 使用服务查询个人报名
    const registrations = await individualService.findIndividualRegistrations(
      { 'leader.phone': phone }
    );
    
    if (!registrations || registrations.length === 0) {
      return ResponseUtil.error(res, '未找到该手机号的个人报名记录', 404);
    }
    
    return ResponseUtil.success(res, '查询个人报名成功', registrations[0], 200);
  } catch (error) {
    logger.error(`根据手机号查询个人报名错误: ${error.message}`);
    return ResponseUtil.error(res, '查询个人报名时发生错误', 500);
  }
};

module.exports = {
  createIndividualRegistration,
  getIndividualRegistration,
  updateIndividualRegistration,
  getIndividualRegistrations,
  getIndividualByPhone
}; 