const Registration = require('../models/Registration');
const Statistic = require('../models/Statistic');

// 获取所有报名记录
exports.getAllRegistrations = async (req, res) => {
  try {
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // 筛选
    let filter = {};
    if (req.query.status) {
      filter.paymentStatus = req.query.status;
    }
    if (req.query.isTeamLeader) {
      filter.isTeamLeader = req.query.isTeamLeader === 'true';
    }
    
    // 获取所有注册记录
    let registrations;
    try {
      registrations = await Registration.find(filter);
    } catch (findError) {
      console.error('查询记录出错:', findError);
      throw findError;
    }
    
    // 确保registrations是数组
    if (!Array.isArray(registrations)) {
      registrations = registrations ? (Array.isArray(registrations) ? registrations : [registrations]) : [];
    }
    
    let total = registrations.length;
    
    // 手动处理所有查询、排序和分页
    try {
      // 处理搜索
      if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase();
        try {
          registrations = registrations.filter(reg => 
            (reg.name && reg.name.toLowerCase().includes(searchTerm)) ||
            (reg.phone && reg.phone.includes(searchTerm)) ||
            (reg.orderNo && reg.orderNo.includes(searchTerm))
          );
          total = registrations.length;
        } catch (searchError) {
          console.error('搜索过滤错误:', searchError);
          // 继续使用原始数据
        }
      }
      
      // 排序 - 按创建时间降序
      try {
        registrations.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      } catch (sortError) {
        console.error('排序错误:', sortError);
        // 继续使用未排序数据
      }
      
      // 手动分页
      try {
        const pagedRegistrations = registrations.slice(skip, skip + limit);
        
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
  try {
    // 增加浏览量计数
    let stats;
    try {
      stats = await Statistic.findOneAndUpdate(
        {}, // 空条件，将更新或创建唯一记录
        { $inc: { viewCount: 1 }, $set: { lastUpdated: new Date() } }, // 增加计数并更新时间
        { new: true, upsert: true } // 返回更新后的文档，如果不存在则创建
      );
      
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

// 添加内存缓存
const statsCache = {
  data: null,
  timestamp: 0,
  expiryTime: 300000 // 缓存有效期增加到5分钟
};

// 获取报名统计
exports.getRegistrationStats = async (req, res) => {
  try {
    // 1. 检查客户端是否支持缓存控制
    const cacheControl = req.headers['cache-control'];
    const forceRefresh = cacheControl && cacheControl.includes('no-cache');
    
    // 2. 检查缓存是否有效
    const now = Date.now();
    if (!forceRefresh && statsCache.data && (now - statsCache.timestamp < statsCache.expiryTime)) {
      return res.status(200).json({
        success: true,
        data: statsCache.data,
        fromCache: true
      });
    }
    
    // 3. 获取统计数据
    const result = {
      totalCount: 0,
      teamLeaderCount: 0,
      teamMemberCount: 0,
      totalAmount: 0,
      todayCount: 0,
      viewsCount: 0
    };
    
    try {
      // 设置超时Promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('查询超时')), 5000)
      );
      
      // 并行执行查询，带超时控制
      const [stats, viewStats] = await Promise.all([
        Promise.race([
          // 使用新增的安全聚合方法
          Registration.safeAggregate([
            { $match: { paymentStatus: 'success' } },
            { $group: {
                _id: null,
                totalCount: { $sum: 1 },
                teamLeaderCount: { $sum: { $cond: [{ $eq: ["$isTeamLeader", true] }, 1, 0] } },
                totalAmount: { $sum: { $ifNull: ["$paymentAmount", 0] } },
                todayCount: {
                  $sum: {
                    $cond: [
                      { $gte: ["$createdAt", new Date(new Date().setHours(0, 0, 0, 0)) ] },
                      1, 
                      0
                    ]
                  }
                }
              }
            }
          ]),
          timeout
        ]),
        Statistic.findOne({})
      ]);
      
      // 处理聚合结果
      if (stats && stats.length > 0) {
        const data = stats[0];
        result.totalCount = data.totalCount || 0;
        result.teamLeaderCount = data.teamLeaderCount || 0;
        result.teamMemberCount = result.totalCount - result.teamLeaderCount;
        result.totalAmount = data.totalAmount || 0;
        result.todayCount = data.todayCount || 0;
      }
      
      // 处理浏览量数据
      if (viewStats && typeof viewStats.viewCount === 'number') {
        result.viewsCount = viewStats.viewCount;
      }
    } catch (error) {
      console.error('统计数据获取失败:', error);
      
      // 使用优化的方法查询
      try {
        // 使用新添加的静态方法
        const [registrations, viewStats] = await Promise.all([
          Registration.findSuccessful(),
          Statistic.findOne({})
        ]);
        
        // 确保registrations是数组
        const allRegistrations = Array.isArray(registrations) ? 
          registrations : 
          (registrations ? [registrations] : []);
        
        // 计算统计数据
        result.totalCount = allRegistrations.length;
        result.teamLeaderCount = allRegistrations.filter(r => r && r.isTeamLeader === true).length;
        result.teamMemberCount = result.totalCount - result.teamLeaderCount;
        
        // 计算总金额
        result.totalAmount = allRegistrations.reduce((sum, r) => {
          return sum + (r && r.paymentAmount ? Number(r.paymentAmount) : 0);
        }, 0);
        
        // 计算今日报名
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        result.todayCount = allRegistrations.filter(r => {
          const createdDate = new Date(r.createdAt);
          return !isNaN(createdDate.getTime()) && createdDate >= today;
        }).length;
        
        // 处理浏览量
        if (viewStats && typeof viewStats.viewCount === 'number') {
          result.viewsCount = viewStats.viewCount;
        }
      } catch (fallbackError) {
        console.error('备选查询也失败:', fallbackError);
        // 保持result使用默认值
      }
    }
    
    // 4. 更新缓存
    statsCache.data = result;
    statsCache.timestamp = now;
    
    // 5. 返回结果
    return res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('获取报名统计失败:', error);
    console.error('错误堆栈:', error.stack);
    
    // 如果有缓存，在出错时也返回缓存数据
    if (statsCache.data) {
      return res.status(200).json({
        success: true,
        data: statsCache.data,
        fromCache: true,
        error: '获取最新数据时出错，显示缓存数据'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: '获取报名统计失败', 
      error: error.message 
    });
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
    let registrations;
    try {
      registrations = await Registration.find(filter);
    } catch (findError) {
      console.error('查询导出数据出错:', findError);
      throw findError;
    }
    
    // 确保registrations是数组
    if (!Array.isArray(registrations)) {
      registrations = registrations ? (Array.isArray(registrations) ? registrations : [registrations]) : [];
    }
    
    // 手动排序
    try {
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