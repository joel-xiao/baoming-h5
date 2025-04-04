const crypto = require('crypto');
const ModelFactory = require('../../core/db/ModelFactory');
const Payment = require('../../core/models/Payment');
const Registration = require('../../core/models/Registration');
const logger = require('../../core/utils/Logger');
const { PaymentService } = require('../../core/services/PaymentService');
const appConfig = require('../../config/app');

/**
 * 创建支付订单
 * @route POST /api/payment/create
 * @access 公开
 */
const createPaymentOrder = async (req, res) => {
  try {
    const {
      registrationId,
      paymentMethod,
      amount,
      payerName,
      payerPhone,
      payerEmail,
      remarks
    } = req.body;
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找注册记录
    const registration = await registrationModel.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    // 检查注册状态
    if (registration.status !== '已审核') {
      return res.status(400).json({
        success: false,
        message: '该注册记录未审核通过，无法支付'
      });
    }
    
    // 检查支付状态
    if (registration.paymentStatus === '已支付') {
      return res.status(400).json({
        success: false,
        message: '该注册记录已完成支付'
      });
    }
    
    // 生成订单号
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderNumber = `ORD${year}${month}${day}${random}`;
    
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 创建支付记录
    const payment = await paymentModel.create({
      orderNumber,
      registrationId,
      teamName: registration.teamName,
      paymentMethod,
      amount,
      payerName: payerName || registration.leader.name,
      payerPhone: payerPhone || registration.leader.phone,
      payerEmail: payerEmail || registration.leader.email,
      remarks,
      status: '待支付',
      createdAt: new Date()
    });
    
    // 初始化支付服务
    const paymentService = new PaymentService();
    
    // 创建支付链接
    let paymentResult;
    
    try {
      if (paymentMethod === '微信支付') {
        paymentResult = await paymentService.createWechatPayment({
          orderNumber,
          amount,
          description: `团队报名费: ${registration.teamName}`,
          notifyUrl: `${appConfig.payment.wechatPay.notifyUrl}`,
          openid: req.body.openid // 可选，用于JSAPI支付
        });
      } else if (paymentMethod === '支付宝') {
        paymentResult = await paymentService.createAlipayPayment({
          orderNumber,
          amount,
          subject: `团队报名费: ${registration.teamName}`,
          notifyUrl: `${appConfig.payment.alipay.notifyUrl}`
        });
      } else {
        // 线下支付或其他方式
        paymentResult = {
          success: true,
          paymentUrl: null,
          message: '请按照说明进行线下支付'
        };
      }
    } catch (paymentError) {
      logger.error(`创建支付接口错误: ${paymentError.message}`);
      
      // 将支付记录状态更新为失败
      payment.status = '支付失败';
      payment.errorMessage = paymentError.message;
      await payment.save();
      
      return res.status(500).json({
        success: false,
        message: '创建支付接口失败',
        error: paymentError.message
      });
    }
    
    // 更新支付记录
    if (paymentResult.paymentUrl) {
      payment.paymentUrl = paymentResult.paymentUrl;
    }
    
    if (paymentResult.qrCode) {
      payment.qrCode = paymentResult.qrCode;
    }
    
    await payment.save();
    
    logger.info(`支付订单已创建: ${orderNumber}, 团队: ${registration.teamName}, 金额: ${amount}`);
    
    res.status(201).json({
      success: true,
      message: '支付订单创建成功',
      data: {
        orderNumber: payment.orderNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentUrl: payment.paymentUrl,
        qrCode: payment.qrCode,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    logger.error(`创建支付订单错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建支付订单时发生错误'
    });
  }
};

/**
 * 查询支付状态
 * @route GET /api/payment/status/:id
 * @access 公开
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 查找支付记录
    const payment = await paymentModel.findOne({
      $or: [
        { _id: id },
        { orderNumber: id }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 如果状态是待支付且创建时间超过一天，更新为已关闭
    if (payment.status === '待支付') {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      if (payment.createdAt < oneDayAgo) {
        payment.status = '已关闭';
        payment.closedAt = new Date();
        await payment.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: '获取支付状态成功',
      data: {
        orderNumber: payment.orderNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        closedAt: payment.closedAt
      }
    });
  } catch (error) {
    logger.error(`查询支付状态错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '查询支付状态时发生错误'
    });
  }
};

/**
 * 微信支付回调接口
 * @route POST /api/payment/notify/wechat
 * @access 公开
 */
const wechatPayNotify = async (req, res) => {
  try {
    // 初始化支付服务
    const paymentService = new PaymentService();
    
    // 解析微信支付回调
    const result = await paymentService.parseWechatPayNotify(req);
    
    if (!result.success) {
      logger.error(`微信支付回调验证失败: ${result.message}`);
      return res.status(400).json({
        code: 'FAIL',
        message: result.message
      });
    }
    
    // 处理支付结果
    await handlePaymentSuccess(result.data.out_trade_no, {
      paymentMethod: '微信支付',
      transactionId: result.data.transaction_id,
      paidAmount: parseInt(result.data.amount.total) / 100, // 转换为元
      paidTime: new Date()
    });
    
    // 返回成功响应
    res.status(200).json({
      code: 'SUCCESS',
      message: 'OK'
    });
  } catch (error) {
    logger.error(`微信支付回调处理错误: ${error.message}`);
    res.status(500).json({
      code: 'FAIL',
      message: error.message
    });
  }
};

/**
 * 支付宝回调接口
 * @route POST /api/payment/notify/alipay
 * @access 公开
 */
const alipayNotify = async (req, res) => {
  try {
    // 初始化支付服务
    const paymentService = new PaymentService();
    
    // 解析支付宝回调
    const result = await paymentService.parseAlipayNotify(req.body);
    
    if (!result.success) {
      logger.error(`支付宝回调验证失败: ${result.message}`);
      return res.status(400).send('fail');
    }
    
    // 处理支付结果
    await handlePaymentSuccess(result.data.out_trade_no, {
      paymentMethod: '支付宝',
      transactionId: result.data.trade_no,
      paidAmount: parseFloat(result.data.total_amount),
      paidTime: new Date(result.data.gmt_payment)
    });
    
    // 返回成功响应
    res.status(200).send('success');
  } catch (error) {
    logger.error(`支付宝回调处理错误: ${error.message}`);
    res.status(500).send('fail');
  }
};

/**
 * 处理支付成功逻辑
 * @param {string} orderNumber 订单号
 * @param {Object} paymentInfo 支付信息
 */
const handlePaymentSuccess = async (orderNumber, paymentInfo) => {
  try {
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 查找支付记录
    const payment = await paymentModel.findOne({ orderNumber });
    
    if (!payment) {
      throw new Error(`订单不存在: ${orderNumber}`);
    }
    
    // 如果已经支付完成，则不重复处理
    if (payment.status === '已支付') {
      logger.warn(`订单已支付，跳过处理: ${orderNumber}`);
      return;
    }
    
    // 更新支付记录
    payment.status = '已支付';
    payment.transactionId = paymentInfo.transactionId;
    payment.paidAmount = paymentInfo.paidAmount;
    payment.paidAt = paymentInfo.paidTime;
    
    await payment.save();
    
    // 更新注册记录
    const registrationModel = ModelFactory.getModel(Registration);
    const registration = await registrationModel.findById(payment.registrationId);
    
    if (registration) {
      // 计算已支付总额
      const paidPayments = await paymentModel.find({
        registrationId: registration._id,
        status: '已支付'
      });
      
      const totalPaid = paidPayments.reduce((total, p) => total + p.paidAmount, 0);
      
      // 更新注册记录支付状态
      registration.paidAmount = totalPaid;
      
      // 判断是否完全支付
      if (totalPaid >= registration.totalAmount) {
        registration.paymentStatus = '已支付';
        registration.paidAt = new Date();
      } else {
        registration.paymentStatus = '部分支付';
      }
      
      await registration.save();
    }
    
    logger.info(`支付成功处理完成: ${orderNumber}, 交易号: ${paymentInfo.transactionId}, 金额: ${paymentInfo.paidAmount}`);
  } catch (error) {
    logger.error(`处理支付成功逻辑错误: ${error.message}`);
    throw error;
  }
};

/**
 * 手动更新支付状态
 * @route PUT /api/payment/:id/status
 * @access 私有 管理员
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paidAmount, transactionId, remarks } = req.body;
    
    if (!['待支付', '已支付', '已关闭', '已退款', '支付失败'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态无效'
      });
    }
    
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 查找支付记录
    const payment = await paymentModel.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 更新支付记录
    payment.status = status;
    
    if (status === '已支付') {
      payment.paidAmount = paidAmount || payment.amount;
      payment.paidAt = new Date();
      payment.transactionId = transactionId;
    } else if (status === '已关闭') {
      payment.closedAt = new Date();
    } else if (status === '已退款') {
      payment.refundedAt = new Date();
    }
    
    if (remarks) {
      payment.remarks = payment.remarks 
        ? `${payment.remarks}\n${new Date().toISOString()} - ${req.user.username}: ${remarks}`
        : `${new Date().toISOString()} - ${req.user.username}: ${remarks}`;
    }
    
    payment.updatedAt = new Date();
    await payment.save();
    
    // 如果状态是已支付，更新注册记录
    if (status === '已支付') {
      await handlePaymentSuccess(payment.orderNumber, {
        paymentMethod: payment.paymentMethod,
        transactionId: transactionId || '手动更新',
        paidAmount: paidAmount || payment.amount,
        paidTime: new Date()
      });
    }
    
    logger.info(`支付状态已手动更新: ${id}, 状态: ${status}, 操作者: ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: '支付状态更新成功',
      data: payment
    });
  } catch (error) {
    logger.error(`手动更新支付状态错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新支付状态时发生错误'
    });
  }
};

/**
 * 获取注册记录的所有支付记录
 * @route GET /api/payment/registration/:registrationId
 * @access 私有
 */
const getPaymentsByRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 查找支付记录
    const payments = await paymentModel.find({ registrationId }).sort({ createdAt: -1 });
    
    // 获取Registration模型
    const registrationModel = ModelFactory.getModel(Registration);
    
    // 查找注册记录
    const registration = await registrationModel.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '注册记录不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '获取支付记录成功',
      data: {
        registration: {
          id: registration._id,
          teamName: registration.teamName,
          paymentStatus: registration.paymentStatus,
          paidAmount: registration.paidAmount || 0,
          totalAmount: registration.totalAmount || 0
        },
        payments
      }
    });
  } catch (error) {
    logger.error(`获取注册记录支付列表错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取支付记录时发生错误'
    });
  }
};

/**
 * 管理员获取所有支付订单
 * @route GET /api/payment/admin/orders
 * @access 私有 管理员
 */
const getAllPaymentOrders = async (req, res) => {
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
        { orderNumber: { $regex: search, $options: 'i' } },
        { teamName: { $regex: search, $options: 'i' } },
        { payerName: { $regex: search, $options: 'i' } },
        { payerPhone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 查询记录
    const payments = await paymentModel.find(query)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 获取总记录数
    const total = await paymentModel.countDocuments(query);
    
    res.status(200).json({
      success: true,
      message: '获取支付订单成功',
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`获取支付订单错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取支付订单时发生错误'
    });
  }
};

/**
 * 退款处理
 * @route POST /api/payment/refund/:id
 * @access 私有 管理员
 */
const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 查找支付记录
    const payment = await paymentModel.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 检查支付状态
    if (payment.status !== '已支付') {
      return res.status(400).json({
        success: false,
        message: '只能对已支付的订单进行退款'
      });
    }
    
    // 检查退款金额
    if (amount > payment.paidAmount) {
      return res.status(400).json({
        success: false,
        message: '退款金额不能大于支付金额'
      });
    }
    
    // 初始化支付服务
    const paymentService = new PaymentService();
    
    // 进行退款操作
    let refundResult;
    try {
      if (payment.paymentMethod === '微信支付') {
        refundResult = await paymentService.refundWechatPayment({
          orderNumber: payment.orderNumber,
          transactionId: payment.transactionId,
          totalAmount: payment.paidAmount,
          refundAmount: amount,
          reason: reason || '管理员操作退款'
        });
      } else if (payment.paymentMethod === '支付宝') {
        refundResult = await paymentService.refundAlipayPayment({
          orderNumber: payment.orderNumber,
          transactionId: payment.transactionId,
          refundAmount: amount,
          reason: reason || '管理员操作退款'
        });
      } else {
        // 线下支付或其他方式，直接标记为已退款
        refundResult = {
          success: true,
          refundId: `MANUAL-${Date.now()}`,
          message: '手动退款已记录'
        };
      }
    } catch (refundError) {
      logger.error(`退款接口错误: ${refundError.message}`);
      return res.status(500).json({
        success: false,
        message: '退款处理失败',
        error: refundError.message
      });
    }
    
    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: refundResult.message
      });
    }
    
    // 更新支付记录
    payment.status = amount === payment.paidAmount ? '已退款' : '部分退款';
    payment.refundId = refundResult.refundId;
    payment.refundAmount = amount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.updatedAt = new Date();
    
    await payment.save();
    
    // 更新注册记录
    const registrationModel = ModelFactory.getModel(Registration);
    const registration = await registrationModel.findById(payment.registrationId);
    
    if (registration) {
      // 重新计算已支付总额
      const paidPayments = await paymentModel.find({
        registrationId: registration._id,
        status: { $in: ['已支付', '部分退款'] }
      });
      
      let totalPaid = 0;
      
      paidPayments.forEach(p => {
        if (p.status === '已支付') {
          totalPaid += p.paidAmount;
        } else if (p.status === '部分退款') {
          totalPaid += (p.paidAmount - p.refundAmount);
        }
      });
      
      // 更新注册记录支付状态
      registration.paidAmount = totalPaid;
      
      if (totalPaid <= 0) {
        registration.paymentStatus = '未支付';
        registration.paidAt = null;
      } else if (totalPaid >= registration.totalAmount) {
        registration.paymentStatus = '已支付';
      } else {
        registration.paymentStatus = '部分支付';
      }
      
      await registration.save();
    }
    
    logger.info(`退款处理成功: ${payment.orderNumber}, 退款金额: ${amount}, 退款ID: ${refundResult.refundId}, 操作者: ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: '退款处理成功',
      data: {
        payment,
        refundId: refundResult.refundId
      }
    });
  } catch (error) {
    logger.error(`退款处理错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '退款处理时发生错误'
    });
  }
};

/**
 * 获取支付统计数据
 * @route GET /api/payment/statistics
 * @access 私有 管理员
 */
const getPaymentStatistics = async (req, res) => {
  try {
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 获取总支付金额
    const totalAmount = await paymentModel.aggregate([
      {
        $match: { status: '已支付' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    // 获取今日支付金额
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAmount = await paymentModel.aggregate([
      {
        $match: {
          status: '已支付',
          paidAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    // 获取各种支付方式的统计
    const paymentMethodStats = await paymentModel.aggregate([
      {
        $match: { status: '已支付' }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    // 获取每日支付统计
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const dailyStats = await paymentModel.aggregate([
      {
        $match: {
          status: '已支付',
          paidAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' },
            day: { $dayOfMonth: '$paidAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$paidAmount' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);
    
    // 转换为易用的格式
    const dailyData = dailyStats.map(day => ({
      date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
      count: day.count,
      amount: day.amount
    }));
    
    res.status(200).json({
      success: true,
      message: '获取支付统计数据成功',
      data: {
        total: {
          amount: totalAmount.length > 0 ? totalAmount[0].total : 0,
          count: await paymentModel.countDocuments({ status: '已支付' })
        },
        today: {
          amount: todayAmount.length > 0 ? todayAmount[0].total : 0,
          count: await paymentModel.countDocuments({ status: '已支付', paidAt: { $gte: today } })
        },
        paymentMethods: paymentMethodStats.reduce((acc, curr) => {
          acc[curr._id] = {
            count: curr.count,
            amount: curr.amount
          };
          return acc;
        }, {}),
        daily: dailyData
      }
    });
  } catch (error) {
    logger.error(`获取支付统计数据错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取支付统计数据时发生错误'
    });
  }
};

module.exports = {
  createPaymentOrder,
  getPaymentStatus,
  wechatPayNotify,
  alipayNotify,
  updatePaymentStatus,
  getPaymentsByRegistration,
  getAllPaymentOrders,
  refundPayment,
  getPaymentStatistics
}; 