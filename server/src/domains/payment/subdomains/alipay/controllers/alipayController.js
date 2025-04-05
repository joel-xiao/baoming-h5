const AlipayService = require('../services/AlipayService');
const logger = require('../../../../../infrastructure/utils/helper/Logger');
const { ResponseUtil } = require('../../../../../infrastructure/utils/helper/ResponseUtil');
const { EventEmitter } = require('events');

// 使用单例模式确保事件发射器在整个应用中共享
const eventEmitter = global.eventEmitter || new EventEmitter();
if (!global.eventEmitter) {
  global.eventEmitter = eventEmitter;
}

// 创建服务实例
const alipayService = new AlipayService();

/**
 * 创建支付宝支付订单
 * @param {Object} orderData 订单数据
 * @returns {Promise<Object>} 支付结果
 */
const createAlipayPayment = async (orderData) => {
  try {
    const result = await alipayService.createPayment(orderData);
    
    if (!result.success) {
      logger.error(`创建支付宝支付失败: ${result.message}`);
      return {
        success: false,
        message: result.message
      };
    }
    
    return {
      success: true,
      paymentUrl: result.paymentUrl,
      qrCode: result.qrCode
    };
  } catch (error) {
    logger.error(`创建支付宝支付错误: ${error.message}`);
    return {
      success: false,
      message: `创建支付宝支付错误: ${error.message}`
    };
  }
};

/**
 * 支付宝回调接口
 * @route POST /api/payment/notify/alipay
 * @access 公开
 */
const alipayNotify = async (req, res) => {
  try {
    // 解析支付宝回调
    const result = await alipayService.verifyNotify(req.body);
    
    if (!result.success) {
      logger.error(`支付宝回调验证失败: ${result.message}`);
      // 支付宝回调需要特殊格式响应
      return res.status(400).send('fail');
    }
    
    // 处理支付结果
    const paymentData = {
      orderNumber: result.data.out_trade_no,
      paymentMethod: 'alipay',
      transactionId: result.data.trade_no,
      paidAmount: parseFloat(result.data.total_amount),
      paidTime: new Date(result.data.gmt_payment)
    };
    
    // 发射支付成功事件
    eventEmitter.emit('payment.success', paymentData);
    
    // 支付宝回调需要特殊格式响应
    return res.status(200).send('success');
  } catch (error) {
    logger.error(`支付宝回调处理错误: ${error.message}`);
    return res.status(500).send('fail');
  }
};

/**
 * 查询支付宝订单状态
 * @route GET /api/payment/alipay/query/:orderNumber
 * @access 私有
 */
const queryAlipayOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const result = await alipayService.queryOrder(orderNumber);
    
    if (!result.success) {
      return ResponseUtil.badRequest(res, result.message);
    }
    
    return ResponseUtil.success(res, '查询订单成功', result.data);
  } catch (error) {
    logger.error(`查询支付宝订单错误: ${error.message}`);
    return ResponseUtil.serverError(res, '查询支付宝订单失败', error);
  }
};

/**
 * 退款支付宝支付
 * @param {Object} refundData 退款数据
 * @returns {Promise<Object>} 退款结果
 */
const refundAlipayPayment = async (refundData) => {
  try {
    const result = await alipayService.refundPayment(refundData);
    
    if (!result.success) {
      logger.error(`支付宝退款失败: ${result.message}`);
      return {
        success: false,
        message: result.message
      };
    }
    
    return {
      success: true,
      refundId: result.refundId,
      status: result.status
    };
  } catch (error) {
    logger.error(`支付宝退款错误: ${error.message}`);
    return {
      success: false,
      message: `支付宝退款错误: ${error.message}`
    };
  }
};

module.exports = {
  createAlipayPayment,
  alipayNotify,
  queryAlipayOrder,
  refundAlipayPayment
}; 