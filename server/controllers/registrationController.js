const Registration = require('../models/Registration');
const crypto = require('crypto');

console.log('>> 注册控制器已加载 <<');

// 生成团队ID
const generateTeamId = () => {
  return crypto.randomBytes(8).toString('hex');
};

// 获取报名记录
exports.getRegistrations = async (req, res) => {
  console.log('开始获取报名记录...');
  try {
    console.log('尝试查询 Registration.find()...');
    
    // 获取报名记录
    let registrations;
    try {
      registrations = await Registration.find({ paymentStatus: 'success' });
      console.log('查询成功，获取到记录数:', Array.isArray(registrations) ? registrations.length : '未知');
      console.log('registrations类型:', typeof registrations);
      console.log('是否数组:', Array.isArray(registrations));
    } catch (findError) {
      console.error('查询Registration.find()失败:', findError);
      throw findError;
    }
    
    // 排序处理 - 无论是什么存储模式，都使用手动排序
    let sortedRegistrations;
    
    try {
      // 确保registrations是数组
      if (!Array.isArray(registrations)) {
        console.log('转换查询结果为数组...');
        registrations = Array.isArray(registrations) ? registrations : (registrations ? [registrations] : []);
      }
      
      console.log('使用手动排序方式...');
      // 手动按创建时间排序（降序）
      sortedRegistrations = [...registrations].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // 降序排列
      }).slice(0, 20); // 限制20条
      
      console.log('手动排序完成，排序后记录数:', sortedRegistrations.length);
    } catch (sortError) {
      console.error('排序过程中出错:', sortError);
      // 如果排序失败，则返回未排序的原始记录
      sortedRegistrations = registrations.slice(0, 20);
      console.log('排序失败，使用未排序数据');
    }
    
    console.log('即将返回报名记录，数量:', sortedRegistrations.length);
    
    return res.status(200).json({
      success: true,
      data: sortedRegistrations
    });
  } catch (error) {
    console.error('获取报名记录错误:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: '获取报名记录失败',
      error: error.message
    });
  }
};

// 创建队长报名
exports.createTeamLeader = async (req, res) => {
  try {
    const { name, phone, openid } = req.body;
    
    console.log('创建队长报名:', { name, phone, openid });
    
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
    
    try {
      // 创建队长预报名记录
      // 尝试两种方式，兼容文件存储模式
      let registration;
      
      try {
        // 方式1：使用mongoose模型创建并保存
        registration = new Registration({
          name,
          phone,
          openid,
          isTeamLeader: true,
          teamId,
          paymentStatus: 'pending'
        });
        await registration.save();
      } catch (modelError) {
        console.log('Mongoose模型创建失败，尝试直接调用create方法:', modelError);
        
        // 方式2：直接调用create方法
        registration = await Registration.create({
          name,
          phone,
          openid,
          isTeamLeader: true,
          teamId,
          paymentStatus: 'pending'
        });
      }
      
      return res.status(201).json({
        success: true,
        message: '队长预报名成功',
        data: {
          registration,
          teamId
        }
      });
    } catch (saveError) {
      console.error('保存队长报名数据失败:', saveError);
      return res.status(500).json({ 
        success: false, 
        message: '创建队长报名失败', 
        error: saveError.message
      });
    }
  } catch (error) {
    console.error('创建队长报名错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '创建队长报名失败', 
      error: error.message
    });
  }
};

// 加入团队
exports.joinTeam = async (req, res) => {
  try {
    const { name, phone, openid, teamId } = req.body;
    
    console.log('加入团队:', { name, phone, openid, teamId });
    
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
    
    try {
      // 创建队员预报名记录
      // 尝试两种方式，兼容文件存储模式
      let registration;
      
      try {
        // 方式1：使用mongoose模型创建并保存
        registration = new Registration({
          name,
          phone,
          openid,
          isTeamLeader: false,
          teamId,
          paymentStatus: 'pending'
        });
        await registration.save();
      } catch (modelError) {
        console.log('Mongoose模型创建失败，尝试直接调用create方法:', modelError);
        
        // 方式2：直接调用create方法
        registration = await Registration.create({
          name,
          phone,
          openid,
          isTeamLeader: false,
          teamId,
          paymentStatus: 'pending'
        });
      }
    
      return res.status(201).json({
        success: true,
        message: '成功加入团队',
        data: {
          registration,
          teamId
        }
      });
    } catch (saveError) {
      console.error('保存队员报名数据失败:', saveError);
      return res.status(500).json({ 
        success: false, 
        message: '加入团队失败', 
        error: saveError.message 
      });
    }
  } catch (error) {
    console.error('加入团队错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '加入团队失败', 
      error: error.message 
    });
  }
};

// 获取团队成员
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ success: false, message: '缺少团队ID' });
    }
    
    // 获取指定团队的已支付成员
    const members = await Registration.find({ 
      teamId, 
      paymentStatus: 'success' 
    });
    
    // 如果是数组类型（文件存储模式），手动排序
    let sortedMembers = members;
    if (Array.isArray(members)) {
      sortedMembers = [...members].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB; // 升序排列
      });
    } else {
      // MongoDB模式，使用原生sort
      sortedMembers = await Registration.find({ teamId, paymentStatus: 'success' })
        .sort({ createdAt: 1 });
    }
    
    return res.status(200).json({
      success: true,
      data: sortedMembers
    });
  } catch (error) {
    console.error('获取团队成员错误:', error);
    return res.status(500).json({ success: false, message: '获取团队成员失败' });
  }
}; 