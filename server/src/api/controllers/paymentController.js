const crypto = require('crypto');
const ModelFactory = require('../../core/db/ModelFactory');
const Payment = require('../../core/models/Payment');
const Registration = require('../../core/models/Registration');
const logger = require('../../core/utils/Logger');
const { PaymentService } = require('../../core/services/PaymentService');
const appConfig = require('../../config/app');
const { REGISTRATION_STATUS, PAYMENT_STATUS } = require('../../core/models/Registration');
const { PAYMENT_METHOD, PAYMENT_STATUS: PAYMENT_ORDER_STATUS } = require('../../core/models/Payment');
const { generatePaymentOrderId } = require('../../core/utils/IDGenerator');

/**
 * 创建支付订单
 * @route POST /api/payment/create
 * @access 公开
 */
const createPaymentOrder = async (req, res) => {
  try {
    const {
      registrationId,
      paymentMethod = PAYMENT_METHOD.OTHER, // 设置支付方式为其他
      amount,
      payerName,
      payerPhone,
      payerEmail,
      remarks,
    } = req.body;
    
    // 验证必填字段
    if (!registrationId) {
      return res.status(400).json({
        success: false,
        message: '报名表ID不能为空'
      });
    }
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: '支付金额不能为空'
      });
    }
    
    let registrationInfo = null;
    
    // 如果提供了registrationId，尝试查找注册记录
    if (registrationId) {
      // 获取Registration模型
      const registrationModel = ModelFactory.getModel(Registration);
      
      // 查找注册记录
      registrationInfo = await registrationModel.findById(registrationId);
      
      // 如果找到注册记录，检查支付状态
      if (registrationInfo) {
        // 检查支付状态
        if (registrationInfo.paymentStatus === PAYMENT_STATUS.PAID) {
          return res.status(400).json({
            success: false,
            message: '该注册记录已完成支付'
          });
        }
      }
    }
    
    // 生成订单号
    const orderNumber = generatePaymentOrderId();
    
    // 获取Payment模型
    const paymentModel = ModelFactory.getModel(Payment);
    
    // 创建支付记录
    const payment = await paymentModel.create({
      orderNumber,
      registrationId: registrationId || null,
      teamName: registrationInfo ? registrationInfo.teamName : teamName || '未关联团队',
      paymentMethod,
      amount,
      payerName,
      payerPhone,
      payerEmail,
      remarks,
      status: PAYMENT_ORDER_STATUS.PENDING,
      transactionId: `PENDING-${orderNumber}`,
      createdAt: new Date()
    });
    
    // 初始化支付服务
    const paymentService = new PaymentService();
    
    // 创建支付链接
    let paymentResult;
    
    try {
      if (paymentMethod === PAYMENT_METHOD.WECHAT) {
        paymentResult = await paymentService.createWechatPayment({
          orderNumber,
          amount,
          description: `报名费: ${payment.teamName}`,
          notifyUrl: `${appConfig.payment.wechatPay.notifyUrl}`,
          openid: req.body.openid // 可选，用于JSAPI支付
        });
      } else if (paymentMethod === PAYMENT_METHOD.ALIPAY) {
        paymentResult = await paymentService.createAlipayPayment({
          orderNumber,
          amount,
          subject: `报名费: ${payment.teamName}`,
          notifyUrl: `${appConfig.payment.alipay.notifyUrl}`
        });
      } else if (paymentMethod === PAYMENT_METHOD.TEST) {
        // 测试支付方式，不调用实际支付接口
        paymentResult = {
          success: true,
          paymentUrl: `/test-payment/${orderNumber}`,
          message: '测试支付，无需实际付款'
        };
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
      payment.status = PAYMENT_ORDER_STATUS.FAILED;
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
    
    logger.info(`支付订单已创建: ${orderNumber}, 团队: ${payment.teamName}, 金额: ${amount}`);
    
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
      return res.status(400).json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 如果状态是待支付且创建时间超过一天，更新为已关闭
    if (payment.status === PAYMENT_ORDER_STATUS.PENDING) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      if (payment.createdAt < oneDayAgo) {
        payment.status = PAYMENT_ORDER_STATUS.CLOSED;
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
      paymentMethod: PAYMENT_METHOD.WECHAT,
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
      paymentMethod: PAYMENT_METHOD.ALIPAY,
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
    if (payment.status === PAYMENT_ORDER_STATUS.PAID) {
      logger.warn(`订单已支付，跳过处理: ${orderNumber}`);
      return;
    }
    
    // 更新支付记录
    payment.status = PAYMENT_ORDER_STATUS.PAID;
    payment.transactionId = paymentInfo.transactionId;
    payment.paidAmount = paymentInfo.paidAmount;
    payment.paidAt = paymentInfo.paidTime;
    
    await payment.save();
    
    // 如果有关联的注册记录，更新注册记录的支付状态
    if (payment.registrationId) {
      // 更新注册记录
      const registrationModel = ModelFactory.getModel(Registration);
      const registration = await registrationModel.findById(payment.registrationId);
      
      if (registration) {
        // 计算已支付总额
        const paidPayments = await paymentModel.find({
          registrationId: registration._id,
          status: PAYMENT_ORDER_STATUS.PAID
        });
        
        const totalPaid = paidPayments.reduce((total, p) => total + p.paidAmount, 0);
        
        // 更新注册记录支付状态
        registration.paidAmount = totalPaid;
        
        // 判断是否完全支付
        if (totalPaid >= registration.totalAmount) {
          registration.paymentStatus = PAYMENT_STATUS.PAID;
          registration.paidAt = new Date();
        } else {
          registration.paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
        }
        
        await registration.save();
      }
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
    
    // 检查状态是否有效
    const validStatuses = [
      PAYMENT_ORDER_STATUS.PENDING,
      PAYMENT_ORDER_STATUS.PAID,
      PAYMENT_ORDER_STATUS.CLOSED,
      PAYMENT_ORDER_STATUS.REFUNDED,
      PAYMENT_ORDER_STATUS.FAILED
    ];
    
    if (!validStatuses.includes(status)) {
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
      return res.status(400).json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 更新支付记录
    payment.status = status;
    
    if (status === PAYMENT_ORDER_STATUS.PAID) {
      payment.paidAmount = paidAmount || payment.amount;
      payment.paidAt = new Date();
      payment.transactionId = transactionId;
    } else if (status === PAYMENT_ORDER_STATUS.CLOSED) {
      payment.closedAt = new Date();
    } else if (status === PAYMENT_ORDER_STATUS.REFUNDED) {
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
    if (status === PAYMENT_ORDER_STATUS.PAID) {
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
      return res.status(400).json({
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
      return res.status(400).json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 检查支付状态
    if (payment.status !== PAYMENT_ORDER_STATUS.PAID) {
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
      if (payment.paymentMethod === PAYMENT_METHOD.WECHAT) {
        refundResult = await paymentService.refundWechatPayment({
          orderNumber: payment.orderNumber,
          transactionId: payment.transactionId,
          totalAmount: payment.paidAmount,
          refundAmount: amount,
          reason: reason || '管理员操作退款'
        });
      } else if (payment.paymentMethod === PAYMENT_METHOD.ALIPAY) {
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
    payment.status = amount === payment.paidAmount ? PAYMENT_ORDER_STATUS.REFUNDED : PAYMENT_ORDER_STATUS.PARTIALLY_REFUNDED;
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
        status: { $in: [PAYMENT_ORDER_STATUS.PAID, PAYMENT_ORDER_STATUS.PARTIALLY_REFUNDED] }
      });
      
      let totalPaid = 0;
      
      paidPayments.forEach(p => {
        if (p.status === PAYMENT_ORDER_STATUS.PAID) {
          totalPaid += p.paidAmount;
        } else if (p.status === PAYMENT_ORDER_STATUS.PARTIALLY_REFUNDED) {
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
        $match: { status: 'paid' }
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
          status: 'paid',
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
        $match: { status: 'paid' }
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
          status: 'paid',
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
          count: await paymentModel.countDocuments({ status: 'paid' })
        },
        today: {
          amount: todayAmount.length > 0 ? todayAmount[0].total : 0,
          count: await paymentModel.countDocuments({ status: 'paid', paidAt: { $gte: today } })
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

/**
 * 测试支付成功处理
 * @route GET /api/payment/test-complete/:orderNumber
 * @access 公开
 */
const completeTestPayment = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    // 处理支付结果
    await handlePaymentSuccess(orderNumber, {
      paymentMethod: PAYMENT_METHOD.TEST,
      transactionId: `TEST-${Date.now()}`,
      paidAmount: 0, // 测试支付默认金额为0
      paidTime: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: '测试支付成功完成',
      orderNumber
    });
  } catch (error) {
    logger.error(`测试支付处理错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '测试支付处理失败',
      error: error.message
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
  getPaymentStatistics,
  completeTestPayment
}; 