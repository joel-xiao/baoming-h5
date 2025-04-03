const Registration = require('../models/Registration');
const crypto = require('crypto');

// 生成团队ID
const generateTeamId = () => {
  return crypto.randomBytes(8).toString('hex');
};

// 获取报名记录
exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ paymentStatus: 'success' })
      .sort({ createdAt: -1 })
      .limit(20);
    
    return res.status(200).json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('获取报名记录错误:', error);
    return res.status(500).json({ success: false, message: '获取报名记录失败' });
  }
};

// 创建队长报名
exports.createTeamLeader = async (req, res) => {
  try {
    const { name, phone, openid } = req.body;
    
    if (!name || !phone || !openid) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 检查用户是否已报名
    const existingRegistration = await Registration.findOne({ openid });
    if (existingRegistration) {
      return res.status(400).json({ 
        success: false, 
        message: '您已经报名，请勿重复报名',
        data: {
          orderId: existingRegistration._id,
          orderNo: existingRegistration.orderNo
        }
      });
    }
    
    // 生成团队ID
    const teamId = generateTeamId();
    
    // 创建队长预报名记录
    const registration = new Registration({
      name,
      phone,
      openid,
      isTeamLeader: true,
      teamId,
      paymentStatus: 'pending'
    });
    
    await registration.save();
    
    return res.status(201).json({
      success: true,
      message: '队长预报名成功',
      data: {
        registration,
        teamId
      }
    });
  } catch (error) {
    console.error('创建队长报名错误:', error);
    return res.status(500).json({ success: false, message: '创建队长报名失败' });
  }
};

// 加入团队
exports.joinTeam = async (req, res) => {
  try {
    const { name, phone, openid, teamId } = req.body;
    
    if (!name || !phone || !openid || !teamId) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 检查用户是否已报名
    const existingRegistration = await Registration.findOne({ openid });
    if (existingRegistration) {
      return res.status(400).json({ 
        success: false, 
        message: '您已经报名，请勿重复报名',
        data: {
          orderId: existingRegistration._id,
          orderNo: existingRegistration.orderNo
        }
      });
    }
    
    // 检查团队是否存在
    const teamLeader = await Registration.findOne({ teamId, isTeamLeader: true });
    if (!teamLeader) {
      return res.status(400).json({ success: false, message: '团队不存在' });
    }
    
    // 创建队员预报名记录
    const registration = new Registration({
      name,
      phone,
      openid,
      isTeamLeader: false,
      teamId,
      paymentStatus: 'pending'
    });
    
    await registration.save();
    
    return res.status(201).json({
      success: true,
      message: '成功加入团队',
      data: {
        registration,
        teamId
      }
    });
  } catch (error) {
    console.error('加入团队错误:', error);
    return res.status(500).json({ success: false, message: '加入团队失败' });
  }
};

// 获取团队成员
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ success: false, message: '缺少团队ID' });
    }
    
    const members = await Registration.find({ 
      teamId, 
      paymentStatus: 'success' 
    }).sort({ createdAt: 1 });
    
    return res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('获取团队成员错误:', error);
    return res.status(500).json({ success: false, message: '获取团队成员失败' });
  }
}; 