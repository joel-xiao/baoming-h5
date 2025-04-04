const crypto = require('crypto');
const ModelFactory = require('../../core/db/ModelFactory');
const Registration = require('../../core/models/Registration');
const logger = require('../../core/utils/Logger');
const { sendEmail } = require('../../core/utils/EmailService');
const appConfig = require('../../config/app');

/**
 * 获取近期注册记录
 * @route GET /api/registration
 * @access 公开
 */
const getRecentRegistrations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查询已审核的记录
    const registrations = await registrationModel.find({ status: '已审核' })
      .select('teamName leader.name leader.organization createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
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
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 检查团队名称是否已存在
    const existingTeam = await registrationModel.findOne({ teamName });
    
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: '团队名称已存在'
      });
    }
    
    // 检查领队手机号是否已存在
    const existingLeader = await registrationModel.findOne({ 'leader.phone': leader.phone });
    
    if (existingLeader) {
      return res.status(400).json({
        success: false,
        message: '领队手机号已被注册'
      });
    }
    
    // 创建注册记录
    const registration = await registrationModel.create({
      teamName,
      leader,
      members,
      additionalInfo,
      status: '待审核',
      createdAt: new Date()
    });
    
    // 如果提供了邮箱，发送确认邮件
    if (leader.email) {
      try {
        await sendEmail({
          to: leader.email,
          subject: '【团队报名系统】报名确认',
          text: `尊敬的${leader.name}，您的团队"${teamName}"已成功报名，我们将尽快审核，请留意审核结果通知。`,
          html: `
            <p>尊敬的${leader.name}，</p>
            <p>您的团队"${teamName}"已成功报名，我们将尽快审核，请留意审核结果通知。</p>
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
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找记录
    const registration = await registrationModel.findById(id);
    
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
    
    // 不允许更新状态、审核时间等敏感字段
    delete updateData.status;
    delete updateData.reviewedAt;
    delete updateData.reviewer;
    delete updateData.rejectReason;
    delete updateData.paymentStatus;
    delete updateData.paidAmount;
    delete updateData.paidAt;
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找记录
    const registration = await registrationModel.findById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    // 检查状态，只有待审核状态才能更新
    if (registration.status !== '待审核') {
      return res.status(400).json({
        success: false,
        message: '只有待审核状态的注册记录才能更新'
      });
    }
    
    // 更新记录
    const updatedRegistration = await registrationModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    logger.info(`注册记录已更新: ${id}`);
    
    res.status(200).json({
      success: true,
      message: '更新注册记录成功',
      data: updatedRegistration
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
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找记录
    const registration = await registrationModel.findById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    // 删除记录
    await registrationModel.findByIdAndDelete(id);
    
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
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找记录
    const registration = await registrationModel.findById(teamId);
    
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
    const {
      teamName,
      leader
    } = req.body;
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 检查团队名称是否已存在
    const existingTeam = await registrationModel.findOne({ teamName });
    
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: '团队名称已存在'
      });
    }
    
    // 检查领队手机号是否已存在
    const existingLeader = await registrationModel.findOne({ 'leader.phone': leader.phone });
    
    if (existingLeader) {
      return res.status(400).json({
        success: false,
        message: '领队手机号已被注册'
      });
    }
    
    // 生成团队邀请码
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // 创建预注册记录
    const registration = await registrationModel.create({
      teamName,
      leader,
      members: [],
      inviteCode,
      status: '预注册',
      createdAt: new Date()
    });
    
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
      member
    } = req.body;
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找团队
    const registration = await registrationModel.findOne({ inviteCode });
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '邀请码无效或团队不存在'
      });
    }
    
    // 检查团队状态
    if (registration.status !== '预注册' && registration.status !== '待审核') {
      return res.status(400).json({
        success: false,
        message: '该团队已无法添加成员'
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
    
    // 如果是第一个成员加入，将状态更新为待审核
    if (registration.status === '预注册' && registration.members.length === 1) {
      registration.status = '待审核';
    }
    
    await registration.save();
    
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
        teamId: registration._id,
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
 * 审核注册
 * @route PUT /api/registration/:id/review
 * @access 私有 管理员
 */
const reviewRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, reason } = req.body;
    
    if (!['已审核', '已拒绝'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态无效'
      });
    }
    
    if (status === '已拒绝' && !reason) {
      return res.status(400).json({
        success: false,
        message: '拒绝原因不能为空'
      });
    }
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找记录
    const registration = await registrationModel.findById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    // 更新状态
    registration.status = status;
    registration.reviewedAt = new Date();
    registration.reviewer = req.user._id;
    
    if (remarks) registration.remarks = remarks;
    if (reason) registration.rejectReason = reason;
    
    await registration.save();
    
    // 如果提供了邮箱，发送审核结果邮件
    if (registration.leader.email) {
      try {
        if (status === '已审核') {
          await sendEmail({
            to: registration.leader.email,
            subject: '【团队报名系统】报名审核通过',
            text: `尊敬的${registration.leader.name}，您的团队"${registration.teamName}"报名已审核通过。${remarks ? '备注: ' + remarks : ''}`,
            html: `
              <p>尊敬的${registration.leader.name}，</p>
              <p>恭喜！您的团队"${registration.teamName}"报名已审核通过。</p>
              ${remarks ? `<p>审核备注: ${remarks}</p>` : ''}
              <p>谢谢!</p>
              <p>团队报名系统</p>
            `
          });
        } else {
          await sendEmail({
            to: registration.leader.email,
            subject: '【团队报名系统】报名审核未通过',
            text: `尊敬的${registration.leader.name}，很遗憾，您的团队"${registration.teamName}"报名未通过审核。原因: ${reason}`,
            html: `
              <p>尊敬的${registration.leader.name}，</p>
              <p>很遗憾，您的团队"${registration.teamName}"报名未通过审核。</p>
              <p>未通过原因: ${reason}</p>
              <p>如有疑问，请联系管理员。</p>
              <p>谢谢!</p>
              <p>团队报名系统</p>
            `
          });
        }
        
        logger.info(`审核结果邮件已发送: ${registration.leader.email}, 状态: ${status}`);
      } catch (emailError) {
        logger.error(`发送审核结果邮件错误: ${emailError.message}`);
        // 不影响审核流程，继续处理
      }
    }
    
    logger.info(`注册记录已审核: ${id}, 状态: ${status}, 审核人: ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: `审核${status === '已审核' ? '通过' : '拒绝'}成功`,
      data: registration
    });
  } catch (error) {
    logger.error(`审核注册记录错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '审核注册记录时发生错误'
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
    
    if (!['未支付', '部分支付', '已支付'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: '支付状态无效'
      });
    }
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找记录
    const registration = await registrationModel.findById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    // 更新支付状态
    registration.paymentStatus = paymentStatus;
    
    if (paidAmount) {
      registration.paidAmount = paidAmount;
    }
    
    if (paymentStatus === '已支付') {
      registration.paidAt = new Date();
    }
    
    await registration.save();
    
    logger.info(`注册记录支付状态已更新: ${id}, 状态: ${paymentStatus}, 操作者: ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: '支付状态更新成功',
      data: {
        id: registration._id,
        paymentStatus: registration.paymentStatus,
        paidAmount: registration.paidAmount,
        paidAt: registration.paidAt
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
  reviewRegistration,
  updatePaymentStatus
}; 