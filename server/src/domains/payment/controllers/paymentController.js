const crypto = require('crypto');
const Payment = require('../models/Payment');
const Registration = require('../../registration/models/Registration');
const logger = require('../../../infrastructure/utils/helper/Logger');
const { ResponseUtil } = require('../../../infrastructure/utils/helper/ResponseUtil');
const PaymentService = require('../services/PaymentService');
const RegistrationService = require('../../registration/services/RegistrationService');
const appConfig = require('../../../config/app');
const { REGISTRATION_STATUS, PAYMENT_STATUS } = Registration;
const { PAYMENT_METHOD, PAYMENT_STATUS: PAYMENT_ORDER_STATUS } = Payment;
const { generatePaymentOrderId } = require('../../../infrastructure/utils/helper/IDGenerator');
const DataAccess = require('../../../infrastructure/database/connectors/DataAccess');
const wechatPaymentController = require('../subdomains/wechat/controllers/wechatPaymentController');
const alipayController = require('../subdomains/alipay/controllers/alipayController');

// 创建服务实例
const paymentService = new PaymentService();
const registrationService = new RegistrationService();
const paymentDA = new DataAccess(Payment);

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
      teamName
    } = req.body;
    
    // 验证必填字段
    if (!registrationId) {
      return ResponseUtil.badRequest(res, '报名表ID不能为空');
    }
    
    if (!amount) {
      return ResponseUtil.badRequest(res, '支付金额不能为空');
    }
    
    let registrationInfo = null;
    
    // 如果提供了registrationId，尝试查找注册记录
    if (registrationId) {
      // 查找注册记录
      registrationInfo = await registrationService.getRegistrationById(registrationId);
      
      // 如果找到注册记录，检查支付状态
      if (registrationInfo) {
        // 检查支付状态
        if (registrationInfo.paymentStatus === PAYMENT_STATUS.PAID) {
          return ResponseUtil.badRequest(res, '该注册记录已完成支付');
        }
      }
    }
    
    // 生成订单号
    const orderNumber = generatePaymentOrderId();
    
    // 创建支付记录
    const paymentData = {
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
    };
    
    const payment = await paymentDA.create(paymentData);
    
    // 创建支付链接
    let paymentResult;
    
    try {
      if (paymentMethod === PAYMENT_METHOD.WECHAT) {
        // 使用微信支付子领域控制器
        paymentResult = await wechatPaymentController.createWechatPayment({
          orderNumber,
          amount,
          teamName: payment.teamName,
          openid: req.body.openid // 可选，用于JSAPI支付
        });
      } else if (paymentMethod === PAYMENT_METHOD.ALIPAY) {
        // 使用支付宝子领域控制器
        paymentResult = await alipayController.createAlipayPayment({
          orderNumber,
          amount,
          teamName: payment.teamName
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
      const updateData = {
        status: PAYMENT_ORDER_STATUS.FAILED,
        errorMessage: paymentError.message
      };
      await paymentDA.updateById(payment._id, updateData);
      
      return ResponseUtil.serverError(res, '创建支付接口失败', paymentError);
    }
    
    // 更新支付记录
    const updateData = {};
    
    if (paymentResult.paymentUrl) {
      updateData.paymentUrl = paymentResult.paymentUrl;
    }
    
    if (paymentResult.qrCode) {
      updateData.qrCode = paymentResult.qrCode;
    }
    
    await paymentDA.updateById(payment._id, updateData);
    
    // 获取更新后的支付记录
    const updatedPayment = await paymentDA.findById(payment._id);
    
    logger.info(`支付订单已创建: ${orderNumber}, 团队: ${updatedPayment.teamName}, 金额: ${amount}`);
    
    return ResponseUtil.created(res, '支付订单创建成功', {
      orderNumber: updatedPayment.orderNumber,
      amount: updatedPayment.amount,
      paymentMethod: updatedPayment.paymentMethod,
      paymentUrl: updatedPayment.paymentUrl,
      qrCode: updatedPayment.qrCode,
      status: updatedPayment.status,
      createdAt: updatedPayment.createdAt
    });
  } catch (error) {
    logger.error(`创建支付订单错误: ${error.message}`);
    return ResponseUtil.serverError(res, '创建支付订单时发生错误', error);
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
    
    // 查找支付记录
    const payment = await paymentDA.findOne({
      $or: [
        { _id: id },
        { orderNumber: id }
      ]
    });
    
    if (!payment) {
      return ResponseUtil.notFound(res, '支付记录不存在');
    }
    
    // 如果状态是待支付且创建时间超过一天，更新为已关闭
    if (payment.status === PAYMENT_ORDER_STATUS.PENDING) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      if (payment.createdAt < oneDayAgo) {
        const updateData = {
          status: PAYMENT_ORDER_STATUS.CLOSED,
          closedAt: new Date()
        };
        await paymentDA.updateById(payment._id, updateData);
        payment.status = PAYMENT_ORDER_STATUS.CLOSED;
        payment.closedAt = new Date();
      }
    }
    
    return ResponseUtil.success(res, '获取支付状态成功', {
      orderNumber: payment.orderNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      closedAt: payment.closedAt
    });
  } catch (error) {
    logger.error(`查询支付状态错误: ${error.message}`);
    return ResponseUtil.serverError(res, '查询支付状态时发生错误', error);
  }
};

/**
 * 微信支付回调接口 - 委托给子领域控制器
 * @route POST /api/payment/notify/wechat
 * @access 公开
 */
const wechatPayNotify = async (req, res) => {
  return wechatPaymentController.wechatPayNotify(req, res);
};

/**
 * 支付宝回调接口 - 委托给子领域控制器
 * @route POST /api/payment/notify/alipay
 * @access 公开
 */
const alipayNotify = async (req, res) => {
  return alipayController.alipayNotify(req, res);
};

/**
 * 处理支付成功逻辑
 * @param {string} orderNumber 订单号
 * @param {Object} paymentInfo 支付信息
 */
const handlePaymentSuccess = async (orderNumber, paymentInfo) => {
  try {
    // 查找支付记录
    const payment = await paymentDA.findOne({ orderNumber });
    
    if (!payment) {
      throw new Error(`订单不存在: ${orderNumber}`);
    }
    
    // 如果已经支付完成，则不重复处理
    if (payment.status === PAYMENT_ORDER_STATUS.PAID) {
      logger.warn(`订单已支付，跳过处理: ${orderNumber}`);
      return;
    }
    
    // 更新支付记录
    const updateData = {
      status: PAYMENT_ORDER_STATUS.PAID,
      transactionId: paymentInfo.transactionId,
      paidAmount: paymentInfo.paidAmount,
      paidAt: paymentInfo.paidTime
    };
    
    await paymentDA.updateById(payment._id, updateData);
    
    // 如果有关联的注册记录，更新注册记录的支付状态
    if (payment.registrationId) {
      // 更新注册记录
      const registrationDA = new DataAccess(Registration);
      const registration = await registrationDA.findById(payment.registrationId);
      
      if (registration) {
        // 计算已支付总额
        const paidPayments = await paymentDA.find({
          registrationId: registration._id,
          status: PAYMENT_ORDER_STATUS.PAID
        });
        
        const totalPaid = paidPayments.reduce((total, p) => total + p.paidAmount, 0);
        
        // 更新注册记录支付状态
        const registrationUpdateData = {
          paidAmount: totalPaid
        };
        
        // 判断是否完全支付
        if (totalPaid >= registration.totalAmount) {
          registrationUpdateData.paymentStatus = PAYMENT_STATUS.PAID;
          registrationUpdateData.paidAt = new Date();
        } else {
          registrationUpdateData.paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
        }
        
        await registrationDA.updateById(registration._id, registrationUpdateData);
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
      return ResponseUtil.badRequest(res, '无效的支付状态');
    }
    
    // 查找支付记录
    const payment = await paymentDA.findById(id);
    
    if (!payment) {
      return ResponseUtil.notFound(res, '支付记录不存在');
    }
    
    // 更新支付记录
    const updateData = {
      status: status,
      updatedAt: new Date()
    };
    
    if (status === PAYMENT_ORDER_STATUS.PAID) {
      updateData.paidAmount = paidAmount || payment.amount;
      updateData.paidAt = new Date();
      updateData.transactionId = transactionId;
    } else if (status === PAYMENT_ORDER_STATUS.CLOSED) {
      updateData.closedAt = new Date();
    } else if (status === PAYMENT_ORDER_STATUS.REFUNDED) {
      updateData.refundedAt = new Date();
    }
    
    if (remarks) {
      updateData.remarks = payment.remarks 
        ? `${payment.remarks}\n${new Date().toISOString()} - ${req.user.username}: ${remarks}`
        : `${new Date().toISOString()} - ${req.user.username}: ${remarks}`;
    }
    
    await paymentDA.updateById(payment._id, updateData);
    
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
    
    // 获取更新后的支付记录
    const updatedPayment = await paymentDA.findById(id);
    
    return ResponseUtil.success(res, '支付状态更新成功', updatedPayment);
  } catch (error) {
    logger.error(`手动更新支付状态错误: ${error.message}`);
    return ResponseUtil.serverError(res, '更新支付状态时发生错误', error);
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
    
    // 查找支付记录
    const payments = await paymentDA.find({ registrationId }, { sort: { createdAt: -1 } });
    
    // 查找注册记录
    const registration = await registrationService.getRegistrationById(registrationId);
    
    if (!registration) {
      return ResponseUtil.notFound(res, '注册记录不存在');
    }
    
    return ResponseUtil.success(res, '获取支付记录成功', {
      registration: {
        id: registration._id,
        teamName: registration.teamName,
        paymentStatus: registration.paymentStatus,
        paidAmount: registration.paidAmount || 0,
        totalAmount: registration.totalAmount || 0
      },
      payments
    });
  } catch (error) {
    logger.error(`获取注册记录支付列表错误: ${error.message}`);
    return ResponseUtil.serverError(res, '获取支付记录时发生错误', error);
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
    
    // 查询记录
    const options = {
      sort: { [sort]: order === 'asc' ? 1 : -1 },
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    };
    
    const payments = await paymentDA.find(query, options);
    
    // 获取总记录数
    const total = await paymentDA.count(query);
    
    return ResponseUtil.success(res, '获取支付订单成功', {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`获取支付订单错误: ${error.message}`);
    return ResponseUtil.serverError(res, '获取支付订单时发生错误', error);
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
    
    // 查找支付记录
    const payment = await paymentDA.findById(id);
    
    if (!payment) {
      return ResponseUtil.notFound(res, '支付记录不存在');
    }
    
    // 检查支付状态
    if (payment.status !== PAYMENT_ORDER_STATUS.PAID) {
      return ResponseUtil.badRequest(res, '只能对已支付的订单进行退款');
    }
    
    // 检查退款金额
    if (amount > payment.paidAmount) {
      return ResponseUtil.badRequest(res, '退款金额不能大于支付金额');
    }
    
    // 进行退款操作
    let refundResult;
    try {
      if (payment.paymentMethod === PAYMENT_METHOD.WECHAT) {
        // 使用微信支付子领域控制器
        refundResult = await wechatPaymentController.refundWechatPayment({
          orderNumber: payment.orderNumber,
          transactionId: payment.transactionId,
          totalAmount: payment.paidAmount,
          refundAmount: amount,
          reason: reason || '管理员操作退款'
        });
      } else if (payment.paymentMethod === PAYMENT_METHOD.ALIPAY) {
        // 使用支付宝子领域控制器
        refundResult = await alipayController.refundAlipayPayment({
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
      return ResponseUtil.serverError(res, '退款处理失败', refundError);
    }
    
    if (!refundResult.success) {
      return ResponseUtil.serverError(res, refundResult.message);
    }
    
    // 更新支付记录
    const updateData = {
      status: amount === payment.paidAmount ? PAYMENT_ORDER_STATUS.REFUNDED : PAYMENT_ORDER_STATUS.PARTIALLY_REFUNDED,
      refundId: refundResult.refundId,
      refundAmount: amount,
      refundReason: reason,
      refundedAt: new Date(),
      updatedAt: new Date()
    };
    
    await paymentDA.updateById(payment._id, updateData);
    
    // 更新注册记录
    if (payment.registrationId) {
      // 重新计算已支付总额
      const paidPayments = await paymentDA.find({
        registrationId: payment.registrationId,
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
      const registration = await registrationService.getRegistrationById(payment.registrationId);
      
      if (registration) {
        const registrationUpdateData = {
          paidAmount: totalPaid
        };
        
        if (totalPaid <= 0) {
          registrationUpdateData.paymentStatus = PAYMENT_STATUS.UNPAID;
          registrationUpdateData.paidAt = null;
        } else if (totalPaid >= registration.totalAmount) {
          registrationUpdateData.paymentStatus = PAYMENT_STATUS.PAID;
        } else {
          registrationUpdateData.paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
        }
        
        await registrationService.updateRegistration(registration._id, registrationUpdateData);
      }
    }
    
    logger.info(`退款处理成功: ${payment.orderNumber}, 退款金额: ${amount}, 退款ID: ${refundResult.refundId}, 操作者: ${req.user.username}`);
    
    // 获取更新后的支付记录
    const updatedPayment = await paymentDA.findById(id);
    
    return ResponseUtil.success(res, '退款处理成功', {
      payment: updatedPayment,
      refundId: refundResult.refundId
    });
  } catch (error) {
    logger.error(`退款处理错误: ${error.message}`);
    return ResponseUtil.serverError(res, '退款处理时发生错误', error);
  }
};

/**
 * 获取支付统计数据
 * @route GET /api/payment/statistics
 * @access 私有 管理员
 */
const getPaymentStatistics = async (req, res) => {
  try {
    // 获取总支付金额
    const totalAmount = await paymentDA.aggregate([
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
    
    const todayAmount = await paymentDA.aggregate([
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
    const paymentMethodStats = await paymentDA.aggregate([
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
    
    const dailyStats = await paymentDA.aggregate([
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
    
    return ResponseUtil.success(res, '获取支付统计数据成功', {
      total: {
        amount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        count: await paymentDA.count({ status: 'paid' })
      },
      today: {
        amount: todayAmount.length > 0 ? todayAmount[0].total : 0,
        count: await paymentDA.count({ status: 'paid', paidAt: { $gte: today } })
      },
      paymentMethods: paymentMethodStats.reduce((acc, curr) => {
        acc[curr._id] = {
          count: curr.count,
          amount: curr.amount
        };
        return acc;
      }, {}),
      daily: dailyData
    });
  } catch (error) {
    logger.error(`获取支付统计数据错误: ${error.message}`);
    return ResponseUtil.serverError(res, '获取支付统计数据时发生错误', error);
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
    
    return ResponseUtil.success(res, '测试支付成功完成', { orderNumber });
  } catch (error) {
    logger.error(`测试支付处理错误: ${error.message}`);
    return ResponseUtil.serverError(res, '测试支付处理失败', error);
  }
};

// 初始化事件处理
const initEventHandlers = (app) => {
  const eventEmitter = app.get('eventEmitter');
  if (eventEmitter) {
    eventEmitter.on('payment.success', async (paymentData) => {
      try {
        await handlePaymentSuccess(paymentData.orderNumber, paymentData);
      } catch (error) {
        logger.error(`支付成功事件处理错误: ${error.message}`);
      }
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
  completeTestPayment,
  handlePaymentSuccess,
  initEventHandlers
}; 