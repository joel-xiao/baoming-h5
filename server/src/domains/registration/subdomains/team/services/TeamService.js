const Registration = require('../../../models/Registration');
const { REGISTRATION_STATUS } = Registration;
const logger = require('../../../../../infrastructure/utils/helper/Logger');
const { sendEmail } = require('../../../../../infrastructure/communication/email/EmailService');
const RegistrationService = require('../../../services/RegistrationService');
const IDGenerator = require('../../../../../infrastructure/utils/helper/IDGenerator');

/**
 * 团队服务类
 * 处理团队创建、加入、管理等功能
 */
class TeamService {
  constructor() {
    this.registrationService = new RegistrationService();
  }

  /**
   * 创建团队领队
   * @param {Object} teamData 团队数据
   * @returns {Promise<Object>} 创建结果
   */
  async createTeamLeader(teamData) {
    try {
      const {
        name,
        phone,
        openid,
        email,
        gender = 'male',
        teamName = name,
        eventId = '6425abc1234567890abcdef',
        categoryId = '6425abc1234567890abcdef',
        ...otherProps
      } = teamData;
      
      // 验证必填参数
      if (!name || !phone) {
        return {
          success: false,
          status: 400,
          message: '姓名和手机号为必填项'
        };
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
      const existingLeader = await this.registrationService.findRegistrations({ 'leader.phone': leader.phone });
      
      if (existingLeader && existingLeader.length > 0) {
        return {
          success: false,
          status: 400,
          message: '领队手机号已被注册'
        };
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
      
      const registration = await this.registrationService.createRegistration(registrationData);
      
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
      
      return {
        success: true,
        status: 201,
        data: {
          id: registration._id,
          teamName: registration.teamName,
          inviteCode: registration.inviteCode
        },
        message: '团队创建成功'
      };
    } catch (error) {
      logger.error(`创建团队领队预登记错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '创建团队领队预登记时发生错误',
        error
      };
    }
  }

  /**
   * 加入团队
   * @param {Object} memberData 成员数据
   * @returns {Promise<Object>} 加入结果
   */
  async joinTeam(memberData) {
    try {
      const {
        inviteCode,
        name,
        phone,
        openid,
        email
      } = memberData;
      
      if (!inviteCode || !name || !phone) {
        return {
          success: false,
          status: 400,
          message: '邀请码、姓名和手机号为必填项'
        };
      }
      
      const member = {
        name,
        phone,
        openid,
        email
      };
      
      // 查找团队
      const registrations = await this.registrationService.findRegistrations({ inviteCode });
      const registration = registrations && registrations.length > 0 ? registrations[0] : null;
      
      if (!registration) {
        return {
          success: false,
          status: 400,
          message: '邀请码无效或团队不存在'
        };
      }
      
      // 检查手机号是否已存在于团队中
      const phoneExists = registration.members.some(m => m.phone === member.phone);
      const isLeaderPhone = registration.leader.phone === member.phone;
      
      if (phoneExists || isLeaderPhone) {
        return {
          success: false,
          status: 400,
          message: '该手机号已在团队中'
        };
      }
      
      // 添加团队成员
      registration.members.push(member);
      registration.updatedAt = new Date();
      
      await this.registrationService.updateRegistration(registration._id, registration);
      
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
      
      return {
        success: true,
        data: {
          id: registration._id,
          teamName: registration.teamName,
          memberName: member.name
        },
        message: '成功加入团队'
      };
    } catch (error) {
      logger.error(`加入团队错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '加入团队时发生错误',
        error
      };
    }
  }

  /**
   * 获取团队成员
   * @param {string} teamId 团队ID
   * @returns {Promise<Object>} 团队成员信息
   */
  async getTeamMembers(teamId) {
    try {
      const registration = await this.registrationService.getRegistrationById(teamId);
      
      if (!registration) {
        return {
          success: false,
          status: 404,
          message: '团队不存在'
        };
      }
      
      const teamMembers = {
        teamId: registration._id,
        teamName: registration.teamName,
        leader: registration.leader,
        members: registration.members,
        totalMembers: registration.members.length + 1 // 队长+成员
      };
      
      return {
        success: true,
        data: teamMembers,
        message: '获取团队成员成功'
      };
    } catch (error) {
      logger.error(`获取团队成员错误: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: '获取团队成员时发生错误',
        error
      };
    }
  }
}

// 导出服务实例
module.exports = new TeamService(); 