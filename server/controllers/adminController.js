const Registration = require('../models/Registration');
const Statistic = require('../models/Statistic');

// 获取所有报名记录
exports.getAllRegistrations = async (req, res) => {
  console.log('开始获取所有报名记录...');
  try {
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    console.log('分页参数:', { page, limit, skip });
    
    // 筛选
    let filter = {};
    if (req.query.status) {
      filter.paymentStatus = req.query.status;
    }
    if (req.query.isTeamLeader) {
      filter.isTeamLeader = req.query.isTeamLeader === 'true';
    }
    console.log('查询筛选条件:', filter);
    
    // 获取所有注册记录
    let registrations;
    try {
      registrations = await Registration.find(filter);
      console.log('获取记录成功，原始记录数:', Array.isArray(registrations) ? registrations.length : '未知');
    } catch (findError) {
      console.error('查询记录出错:', findError);
      throw findError;
    }
    
    // 确保registrations是数组
    if (!Array.isArray(registrations)) {
      console.log('转换查询结果为数组');
      registrations = registrations ? (Array.isArray(registrations) ? registrations : [registrations]) : [];
    }
    
    let total = registrations.length;
    
    // 手动处理所有查询、排序和分页
    try {
      // 处理搜索
      if (req.query.search) {
        console.log('处理搜索条件:', req.query.search);
        const searchTerm = req.query.search.toLowerCase();
        try {
          registrations = registrations.filter(reg => 
            (reg.name && reg.name.toLowerCase().includes(searchTerm)) ||
            (reg.phone && reg.phone.includes(searchTerm)) ||
            (reg.orderNo && reg.orderNo.includes(searchTerm))
          );
          total = registrations.length;
          console.log('搜索过滤后记录数:', registrations.length);
        } catch (searchError) {
          console.error('搜索过滤错误:', searchError);
          // 继续使用原始数据
        }
      }
      
      // 排序 - 按创建时间降序
      try {
        console.log('开始按创建时间降序排序...');
        registrations.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        console.log('排序完成');
      } catch (sortError) {
        console.error('排序错误:', sortError);
        // 继续使用未排序数据
      }
      
      // 手动分页
      try {
        console.log('应用分页，从索引', skip, '开始获取', limit, '条记录');
        const pagedRegistrations = registrations.slice(skip, skip + limit);
        console.log('分页后获取记录数:', pagedRegistrations.length);
        
        return res.status(200).json({
          success: true,
          data: {
            registrations: pagedRegistrations,
            pagination: {
              total,
              page,
              limit,
              pages: Math.ceil(total / limit)
            }
          }
        });
      } catch (pageError) {
        console.error('分页错误:', pageError);
        throw pageError;
      }
    } catch (processError) {
      console.error('处理数据过程出错:', processError);
      throw processError;
    }
  } catch (error) {
    console.error('获取所有报名记录错误:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: '获取所有报名记录失败',
      error: error.message
    });
  }
};

// 记录浏览量
exports.recordView = async (req, res) => {
  console.log('记录新的浏览量...');
  try {
    // 增加浏览量计数
    let stats;
    try {
      stats = await Statistic.findOneAndUpdate(
        {}, // 空条件，将更新或创建唯一记录
        { $inc: { viewCount: 1 }, $set: { lastUpdated: new Date() } }, // 增加计数并更新时间
        { new: true, upsert: true } // 返回更新后的文档，如果不存在则创建
      );
      
      console.log('浏览量更新成功，当前浏览量:', stats.viewCount);
      
      return res.status(200).json({
        success: true,
        data: {
          viewCount: stats.viewCount,
          lastUpdated: stats.lastUpdated
        }
      });
    } catch (updateError) {
      console.error('更新浏览量失败:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('记录浏览量错误:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: '记录浏览量失败',
      error: error.message 
    });
  }
};

// 获取报名统计
exports.getRegistrationStats = async (req, res) => {
  try {
    console.log('开始获取报名统计数据...');
    
    // 查询所有支付成功的报名记录
    let allRegistrations;
    try {
      allRegistrations = await Registration.find({ paymentStatus: 'success' });
      console.log('获取报名记录成功，记录数:', Array.isArray(allRegistrations) ? allRegistrations.length : '未知');
    } catch (findError) {
      console.error('查询支付成功记录出错:', findError);
      throw findError;
    }
    
    // 确保allRegistrations是数组
    if (!Array.isArray(allRegistrations)) {
      console.log('转换查询结果为数组');
      allRegistrations = allRegistrations ? (Array.isArray(allRegistrations) ? allRegistrations : [allRegistrations]) : [];
    }
    
    // 获取浏览量数据
    let viewsCount = 0;
    try {
      const stats = await Statistic.findOne({});
      if (stats && typeof stats.viewCount === 'number') {
        viewsCount = stats.viewCount;
      }
      console.log('获取浏览量成功:', viewsCount);
    } catch (statsError) {
      console.error('获取浏览量失败:', statsError);
      // 继续使用默认值0
    }
    
    // 数据处理 - 所有统计计算都使用安全模式
    try {
      // 总报名人数
      const totalCount = allRegistrations.length;
      
      // 队长数量 - 安全过滤
      const teamLeaderCount = allRegistrations.filter(r => {
        try {
          return r && r.isTeamLeader === true;
        } catch (e) {
          console.error('队长过滤错误:', e);
          return false;
        }
      }).length;
      
      // 队员数量
      const teamMemberCount = totalCount - teamLeaderCount;
      
      // 总金额 - 确保安全处理
      const totalAmount = allRegistrations.reduce((sum, r) => {
        try {
          const amount = r && r.paymentAmount ? Number(r.paymentAmount) : 0;
          return sum + (isNaN(amount) ? 0 : amount);
        } catch (e) {
          console.error('金额计算错误:', e);
          return sum;
        }
      }, 0);
      
      // 今日报名 - 今天0点以后的报名
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = allRegistrations.filter(r => {
        try {
          const createdDate = new Date(r.createdAt);
          return !isNaN(createdDate.getTime()) && createdDate >= today;
        } catch (e) {
          console.error('日期计算错误:', e);
          return false;
        }
      }).length;
      
      console.log('统计数据计算完成:', {
        totalCount,
        teamLeaderCount,
        teamMemberCount,
        totalAmount,
        todayCount,
        viewsCount
      });
      
      // 返回统计数据
      return res.status(200).json({
        success: true,
        data: {
          totalCount,
          teamLeaderCount,
          teamMemberCount,
          totalAmount,
          todayCount,
          viewsCount
        }
      });
    } catch (statsError) {
      console.error('计算统计数据出错:', statsError);
      throw statsError;
    }
  } catch (error) {
    console.error('获取报名统计失败:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: '获取报名统计失败', 
      error: error.message 
    });
  }
};

// 导出报名数据
exports.exportRegistrations = async (req, res) => {
  console.log('开始导出报名数据...');
  try {
    // 筛选
    const filter = {};
    if (req.query.status) {
      filter.paymentStatus = req.query.status;
    }
    if (req.query.isTeamLeader) {
      filter.isTeamLeader = req.query.isTeamLeader === 'true';
    }
    console.log('导出筛选条件:', filter);
    
    // 查询所有符合条件的数据
    let registrations;
    try {
      registrations = await Registration.find(filter);
      console.log('查询结果记录数:', Array.isArray(registrations) ? registrations.length : '未知');
    } catch (findError) {
      console.error('查询导出数据出错:', findError);
      throw findError;
    }
    
    // 确保registrations是数组
    if (!Array.isArray(registrations)) {
      console.log('转换查询结果为数组');
      registrations = registrations ? (Array.isArray(registrations) ? registrations : [registrations]) : [];
    }
    
    // 手动排序
    try {
      console.log('按创建时间排序...');
      registrations.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // 降序排列
      });
    } catch (sortError) {
      console.error('排序出错:', sortError);
      // 继续使用未排序数据
    }
    
    // 转换为CSV格式
    try {
      console.log('转换为CSV格式...');
      const fields = ['姓名', '电话', '报名时间', '支付状态', '支付金额', '订单号', '是否队长', '团队ID'];
      let csv = fields.join(',') + '\n';
      
      registrations.forEach(reg => {
        try {
          const row = [
            (reg.name || '').replace(/,/g, '，'), // 防止逗号干扰CSV格式
            (reg.phone || '').replace(/,/g, ''),
            new Date(reg.createdAt || Date.now()).toLocaleString(),
            (reg.paymentStatus === 'success' ? '已支付' : '未支付'),
            reg.paymentAmount || 0,
            (reg.orderNo || '').replace(/,/g, ''),
            (reg.isTeamLeader ? '是' : '否'),
            (reg.teamId || '--').replace(/,/g, '')
          ];
          csv += row.join(',') + '\n';
        } catch (rowError) {
          console.error('处理CSV行出错:', rowError);
          // 跳过有问题的记录
        }
      });
      
      console.log('CSV生成完成，总行数:', registrations.length + 1);
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
      
      // 发送CSV数据
      return res.status(200).send(csv);
    } catch (csvError) {
      console.error('生成CSV出错:', csvError);
      throw csvError;
    }
  } catch (error) {
    console.error('导出报名数据错误:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: '导出报名数据失败',
      error: error.message
    });
  }
}; 