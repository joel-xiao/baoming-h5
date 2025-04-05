const crypto = require('crypto');
const ModelFactory = require('../../../infrastructure/database/connectors/ModelFactory');
const Registration = require('../models/Registration');
const { REGISTRATION_STATUS, PAYMENT_STATUS } = Registration;
const logger = require('../../../infrastructure/utils/helper/Logger');
const { sendEmail } = require('../../../infrastructure/communication/email/EmailService');
const appConfig = require('../../../config/app');
const IDGenerator = require('../../../infrastructure/utils/helper/IDGenerator');
const RegistrationService = require('../services/RegistrationService');

// 创建服务实例
const registrationService = new RegistrationService();

/**
 * 获取近期注册记录
 * @route GET /api/registration
 * @access 公开
 */
const getRecentRegistrations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 使用服务获取最近的注册记录
    const registrations = await registrationService.findRegistrations(
      { status: REGISTRATION_STATUS.ACTIVE },
      { 
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        fields: 'teamName leader.name leader.organization createdAt'
      }
    );
    
    res.status(200).json({
      success: true,
      message: '获取近期注册记录成功',
      data: registrations
    });
  } catch (error) {
    logger.error(`获取近期注册记录错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取注册记录时发生错误'
    });
  }
};

/**
 * 创建新注册
 * @route POST /api/registration
 * @access 公开
 */
const createRegistration = async (req, res) => {
  try {
    const {
      teamName,
      leader,
      members = [],
      additionalInfo = {}
    } = req.body;
    
    // 使用registrationService检查领队手机号是否已注册
    const existingLeader = await registrationService.findRegistrations({ 'leader.phone': leader.phone });
    
    if (existingLeader && existingLeader.length > 0) {
      return res.status(400).json({
        success: false,
        message: '领队手机号已被注册'
      });
    }
    
    // 生成唯一的订单号
    const orderNo = IDGenerator.generateRegistrationOrderId();
    
    // 使用服务创建注册
    const registrationData = {
      teamName,
      leader,
      members,
      additionalInfo,
      orderNo,
      status: REGISTRATION_STATUS.ACTIVE,
      createdAt: new Date()
    };
    
    const registration = await registrationService.createRegistration(registrationData);
    
    // 如果提供了邮箱，发送确认邮件
    if (leader.email) {
      try {
        await sendEmail({
          to: leader.email,
          subject: '【团队报名系统】报名确认',
          text: `尊敬的${leader.name}，您的团队"${teamName}"已成功报名。`,
          html: `
            <p>尊敬的${leader.name}，</p>
            <p>您的团队"${teamName}"已成功报名。</p>
            <p>团队信息:</p>
            <ul>
              <li>团队名称: ${teamName}</li>
              <li>领队姓名: ${leader.name}</li>
              <li>领队手机: ${leader.phone}</li>
              <li>团队成员: ${members.length}人</li>
            </ul>
            <p>谢谢!</p>
            <p>团队报名系统</p>
          `
        });
        
        logger.info(`报名确认邮件已发送: ${leader.email}`);
      } catch (emailError) {
        logger.error(`发送报名确认邮件错误: ${emailError.message}`);
        // 不影响注册流程，继续处理
      }
    }
    
    logger.info(`新注册记录已创建: ${registration._id}, 团队: ${teamName}`);
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        id: registration._id,
        teamName: registration.teamName,
        status: registration.status
      }
    });
  } catch (error) {
    logger.error(`创建注册记录错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建注册记录时发生错误'
    });
  }
};

/**
 * 获取单个注册记录详情
 * @route GET /api/registration/:id
 * @access 公开
 */
const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 使用服务获取注册记录
    const registration = await registrationService.getRegistrationById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '获取注册记录成功',
      data: registration
    });
  } catch (error) {
    logger.error(`获取注册记录详情错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取注册记录时发生错误'
    });
  }
};

/**
 * 更新注册信息
 * @route PUT /api/registration/:id
 * @access 私有
 */
const updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 不允许更新敏感字段
    delete updateData.status;
    delete updateData.paymentStatus;
    delete updateData.paidAmount;
    delete updateData.paidAt;
    
    // 使用服务更新注册记录
    updateData.updatedAt = new Date();
    const registration = await registrationService.updateRegistration(id, updateData);
    
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    logger.info(`注册记录已更新: ${id}`);
    
    res.status(200).json({
      success: true,
      message: '更新注册记录成功',
      data: registration
    });
  } catch (error) {
    logger.error(`更新注册记录错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新注册记录时发生错误'
    });
  }
};

/**
 * 删除注册记录
 * @route DELETE /api/registration/:id
 * @access 私有 管理员
 */
const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 使用服务删除注册记录
    const result = await registrationService.deleteRegistration(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    logger.info(`注册记录已删除: ${id}, 操作者: ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: '删除注册记录成功'
    });
  } catch (error) {
    logger.error(`删除注册记录错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '删除注册记录时发生错误'
    });
  }
};

/**
 * 获取团队成员列表
 * @route GET /api/registration/team/:teamId
 * @access 公开
 */
const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // 使用服务获取注册记录
    const registration = await registrationService.getRegistrationById(teamId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '团队不存在'
      });
    }
    
    // 组合团队成员数据
    const teamMembers = [
      {
        ...registration.leader,
        isLeader: true
      },
      ...registration.members.map(member => ({
        ...member,
        isLeader: false
      }))
    ];
    
    res.status(200).json({
      success: true,
      message: '获取团队成员成功',
      data: {
        teamName: registration.teamName,
        status: registration.status,
        members: teamMembers
      }
    });
  } catch (error) {
    logger.error(`获取团队成员错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取团队成员时发生错误'
    });
  }
};

/**
 * 创建团队领队预登记
 * @route POST /api/registration/leader
 * @access 公开
 */
const createTeamLeader = async (req, res) => {
  try {
    // 适配前端扁平结构的数据
    const {
      name,
      phone,
      openid,
      email,
      gender = 'male', // 默认为男性
      teamName = name, // 如果没有传teamName，则使用name作为teamName
      eventId = '6425abc1234567890abcdef', // 使用默认值
      categoryId = '6425abc1234567890abcdef', // 使用默认值
      ...otherProps
    } = req.body;
    
    // 验证必填参数
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: '姓名和手机号为必填项'
      });
    }
    
    // 构建leader对象
    const leader = {
      name,
      phone,
      gender,
      openid,
      email,
      ...otherProps
    };
    
    // 检查领队手机号是否已存在
    const existingLeader = await registrationService.findRegistrations({ 'leader.phone': leader.phone });
    
    if (existingLeader && existingLeader.length > 0) {
      return res.status(400).json({
        success: false,
        message: '领队手机号已被注册'
      });
    }
    
    // 生成团队邀请码
    const inviteCode = IDGenerator.generateInviteCode();
    
    // 生成唯一的订单号
    const orderNo = IDGenerator.generateTeamOrderId();
    
    // 创建预注册记录
    const registrationData = {
      teamName,
      name: teamName,
      phone: leader.phone,
      gender: leader.gender,
      eventId,
      categoryId,
      leader,
      members: [],
      inviteCode,
      orderNo,
      status: REGISTRATION_STATUS.PENDING,
      createdAt: new Date()
    };
    
    const registration = await registrationService.createRegistration(registrationData);
    
    // 如果提供了邮箱，发送团队邀请码
    if (leader.email) {
      try {
        await sendEmail({
          to: leader.email,
          subject: '【团队报名系统】团队创建成功与邀请码',
          text: `尊敬的${leader.name}，您的团队"${teamName}"已创建成功，团队邀请码为: ${inviteCode}。请将此邀请码分享给您的团队成员，让他们使用此邀请码加入团队。`,
          html: `
            <p>尊敬的${leader.name}，</p>
            <p>您的团队"${teamName}"已创建成功!</p>
            <p>您的团队邀请码为: <strong style="font-size: 18px; color: #4CAF50;">${inviteCode}</strong></p>
            <p>请将此邀请码分享给您的团队成员，让他们使用此邀请码加入团队。</p>
            <p>团队信息:</p>
            <ul>
              <li>团队名称: ${teamName}</li>
              <li>领队姓名: ${leader.name}</li>
              <li>领队手机: ${leader.phone}</li>
            </ul>
            <p>谢谢!</p>
            <p>团队报名系统</p>
          `
        });
        
        logger.info(`团队创建确认邮件已发送: ${leader.email}, 邀请码: ${inviteCode}`);
      } catch (emailError) {
        logger.error(`发送团队创建确认邮件错误: ${emailError.message}`);
        // 不影响创建流程，继续处理
      }
    }
    
    logger.info(`团队领队预登记已创建: ${registration._id}, 团队: ${teamName}, 邀请码: ${inviteCode}`);
    
    res.status(201).json({
      success: true,
      message: '团队创建成功',
      data: {
        id: registration._id,
        teamName: registration.teamName,
        inviteCode: registration.inviteCode
      }
    });
  } catch (error) {
    logger.error(`创建团队领队预登记错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建团队领队预登记时发生错误'
    });
  }
};

/**
 * 加入现有团队
 * @route POST /api/registration/join
 * @access 公开
 */
const joinTeam = async (req, res) => {
  try {
    const {
      inviteCode,
      name,
      phone,
      openid,
      email
    } = req.body;
    
    const member = {
      name,
      phone,
      openid,
      email
    };
    
    // 查找团队
    const registrations = await registrationService.findRegistrations({ inviteCode });
    const registration = registrations && registrations.length > 0 ? registrations[0] : null;
    
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: '邀请码无效或团队不存在'
      });
    }
    
    // 检查手机号是否已存在于团队中
    const phoneExists = registration.members.some(m => m.phone === member.phone);
    const isLeaderPhone = registration.leader.phone === member.phone;
    
    if (phoneExists || isLeaderPhone) {
      return res.status(400).json({
        success: false,
        message: '该手机号已在团队中'
      });
    }
    
    // 添加团队成员
    registration.members.push(member);
    registration.updatedAt = new Date();
    
    await registrationService.updateRegistration(registration._id, registration);
    
    // 如果提供了邮箱，发送确认邮件
    if (member.email) {
      try {
        await sendEmail({
          to: member.email,
          subject: '【团队报名系统】加入团队确认',
          text: `尊敬的${member.name}，您已成功加入团队"${registration.teamName}"，团队领队为${registration.leader.name}。`,
          html: `
            <p>尊敬的${member.name}，</p>
            <p>您已成功加入团队"${registration.teamName}"!</p>
            <p>团队信息:</p>
            <ul>
              <li>团队名称: ${registration.teamName}</li>
              <li>团队领队: ${registration.leader.name}</li>
              <li>领队手机: ${registration.leader.phone}</li>
            </ul>
            <p>谢谢!</p>
            <p>团队报名系统</p>
          `
        });
        
        logger.info(`团队加入确认邮件已发送: ${member.email}, 团队: ${registration.teamName}`);
      } catch (emailError) {
        logger.error(`发送团队加入确认邮件错误: ${emailError.message}`);
        // 不影响加入流程，继续处理
      }
    }
    
    logger.info(`成员已加入团队: ${member.name}, 团队ID: ${registration._id}, 团队: ${registration.teamName}`);
    
    res.status(200).json({
      success: true,
      message: '成功加入团队',
      data: {
        id: registration._id,
        teamName: registration.teamName,
        memberName: member.name
      }
    });
  } catch (error) {
    logger.error(`加入团队错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '加入团队时发生错误'
    });
  }
};

/**
 * 更新支付状态
 * @route PUT /api/registration/:id/payment-status
 * @access 私有
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paidAmount } = req.body;
    
    if (![PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PARTIALLY_PAID, PAYMENT_STATUS.PAID].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: '支付状态无效'
      });
    }
    
    // 获取注册记录
    const registration = await registrationService.getRegistrationById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    // 更新支付状态
    const updateData = {
      paymentStatus: paymentStatus
    };
    
    if (paidAmount) {
      updateData.paidAmount = paidAmount;
    }
    
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      updateData.paidAt = new Date();
    }
    
    const updatedRegistration = await registrationService.updateRegistration(id, updateData);
    
    logger.info(`注册记录支付状态已更新: ${id}, 状态: ${paymentStatus}, 操作者: ${req.user?.username || 'system'}`);
    
    res.status(200).json({
      success: true,
      message: '支付状态更新成功',
      data: {
        id: updatedRegistration._id,
        paymentStatus: updatedRegistration.paymentStatus,
        paidAmount: updatedRegistration.paidAmount,
        paidAt: updatedRegistration.paidAt
      }
    });
  } catch (error) {
    logger.error(`更新支付状态错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新支付状态时发生错误'
    });
  }
};

module.exports = {
  getRecentRegistrations,
  createRegistration,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
  getTeamMembers,
  createTeamLeader,
  joinTeam,
  updatePaymentStatus
}; 