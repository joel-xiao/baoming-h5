const Registration = require('../models/Registration');

// 获取所有报名记录
exports.getAllRegistrations = async (req, res) => {
  try {
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // 筛选
    const filter = {};
    if (req.query.status) {
      filter.paymentStatus = req.query.status;
    }
    if (req.query.isTeamLeader) {
      filter.isTeamLeader = req.query.isTeamLeader === 'true';
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { orderNo: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // 查询数据
    const registrations = await Registration.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // 总记录数
    const total = await Registration.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      data: {
        registrations,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取所有报名记录错误:', error);
    return res.status(500).json({ success: false, message: '获取所有报名记录失败' });
  }
};

// 获取报名统计
exports.getRegistrationStats = async (req, res) => {
  try {
    // 总报名人数
    const totalCount = await Registration.countDocuments({ paymentStatus: 'success' });
    
    // 队长数量
    const teamLeaderCount = await Registration.countDocuments({ 
      isTeamLeader: true,
      paymentStatus: 'success'
    });
    
    // 队员数量
    const teamMemberCount = await Registration.countDocuments({ 
      isTeamLeader: false,
      paymentStatus: 'success'
    });
    
    // 总收入
    const totalAmount = await Registration.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
    ]);
    
    // 今日报名人数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Registration.countDocuments({
      paymentStatus: 'success',
      createdAt: { $gte: today }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalCount,
        teamLeaderCount,
        teamMemberCount,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        todayCount
      }
    });
  } catch (error) {
    console.error('获取报名统计错误:', error);
    return res.status(500).json({ success: false, message: '获取报名统计失败' });
  }
};

// 导出报名数据
exports.exportRegistrations = async (req, res) => {
  try {
    // 筛选
    const filter = {};
    if (req.query.status) {
      filter.paymentStatus = req.query.status;
    }
    if (req.query.isTeamLeader) {
      filter.isTeamLeader = req.query.isTeamLeader === 'true';
    }
    
    // 查询所有符合条件的数据
    const registrations = await Registration.find(filter).sort({ createdAt: -1 });
    
    // 转换为CSV格式
    const fields = ['姓名', '电话', '报名时间', '支付状态', '支付金额', '订单号', '是否队长', '团队ID'];
    let csv = fields.join(',') + '\n';
    
    registrations.forEach(reg => {
      const row = [
        reg.name,
        reg.phone,
        new Date(reg.createdAt).toLocaleString(),
        reg.paymentStatus === 'success' ? '已支付' : '未支付',
        reg.paymentAmount,
        reg.orderNo,
        reg.isTeamLeader ? '是' : '否',
        reg.teamId || '--'
      ];
      csv += row.join(',') + '\n';
    });
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
    
    // 发送CSV数据
    return res.status(200).send(csv);
  } catch (error) {
    console.error('导出报名数据错误:', error);
    return res.status(500).json({ success: false, message: '导出报名数据失败' });
  }
}; 