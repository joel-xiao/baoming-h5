const WechatPaymentService = require('../services/WechatPaymentService');
const logger = require('../../../../../infrastructure/utils/helper/Logger');
const { ResponseUtil } = require('../../../../../infrastructure/utils/helper/ResponseUtil');
const config = require('../../../../../config/app');
const { EventEmitter } = require('events');

// 使用单例模式确保事件发射器在整个应用中共享
const eventEmitter = global.eventEmitter || new EventEmitter();
if (!global.eventEmitter) {
  global.eventEmitter = eventEmitter;
}

// 创建服务实例
const wechatPaymentService = new WechatPaymentService();

/**
 * 创建微信支付订单
 * @param {Object} orderData 订单数据
 * @returns {Promise<Object>} 支付结果
 */
const createWechatPayment = async (orderData) => {
  try {
    const result = await wechatPaymentService.createPayment(orderData);
    
    if (!result.success) {
      logger.error(`创建微信支付失败: ${result.message}`);
      return {
        success: false,
        message: result.message
      };
    }
    
    return {
      success: true,
      paymentUrl: result.paymentUrl,
      qrCode: result.qrCode,
      prepayId: result.prepayId
    };
  } catch (error) {
    logger.error(`创建微信支付错误: ${error.message}`);
    return {
      success: false,
      message: `创建微信支付错误: ${error.message}`
    };
  }
};

/**
 * 获取JSAPI支付参数
 * @route GET /api/payment/wechat/jsapi-params/:orderNumber
 * @access 公开
 */
const getJsapiParameters = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { prepayId } = req.query;
    
    if (!prepayId) {
      return ResponseUtil.badRequest(res, '缺少预支付ID');
    }
    
    const params = await wechatPaymentService.getJsapiParameters(prepayId);
    
    return ResponseUtil.success(res, '获取JSAPI支付参数成功', params);
  } catch (error) {
    logger.error(`获取JSAPI支付参数错误: ${error.message}`);
    return ResponseUtil.serverError(res, '获取JSAPI支付参数失败', error);
  }
};

/**
 * 微信支付回调接口
 * @route POST /api/payment/notify/wechat
 * @access 公开
 */
const wechatPayNotify = async (req, res) => {
  try {
    // 解析微信支付回调
    const result = await wechatPaymentService.verifyNotify(req);
    
    if (!result.success) {
      logger.error(`微信支付回调验证失败: ${result.message}`);
      // 微信支付回调需要特殊格式响应
      return res.status(400).json({
        code: 'FAIL',
        message: result.message
      });
    }
    
    // 处理支付结果
    const paymentData = {
      orderNumber: result.data.out_trade_no,
      paymentMethod: 'wechat',
      transactionId: result.data.transaction_id,
      paidAmount: parseInt(result.data.amount.total) / 100, // 转换为元
      paidTime: new Date()
    };
    
    // 发射支付成功事件
    eventEmitter.emit('payment.success', paymentData);
    
    // 微信支付回调需要特殊格式响应
    return res.status(200).json({
      code: 'SUCCESS',
      message: 'OK'
    });
  } catch (error) {
    logger.error(`微信支付回调处理错误: ${error.message}`);
    // 微信支付回调需要特殊格式响应
    return res.status(500).json({
      code: 'FAIL',
      message: error.message
    });
  }
};

/**
 * 查询微信支付订单状态
 * @route GET /api/payment/wechat/query/:orderNumber
 * @access 私有
 */
const queryWechatOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const result = await wechatPaymentService.queryOrder(orderNumber);
    
    if (!result.success) {
      return ResponseUtil.badRequest(res, result.message);
    }
    
    return ResponseUtil.success(res, '查询订单成功', result.data);
  } catch (error) {
    logger.error(`查询微信支付订单错误: ${error.message}`);
    return ResponseUtil.serverError(res, '查询微信支付订单失败', error);
  }
};

/**
 * 退款操作
 * @param {Object} refundData 退款数据
 * @returns {Promise<Object>} 退款结果
 */
const refundWechatPayment = async (refundData) => {
  try {
    const result = await wechatPaymentService.refundPayment(refundData);
    
    if (!result.success) {
      logger.error(`微信退款失败: ${result.message}`);
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
    logger.error(`微信退款错误: ${error.message}`);
    return {
      success: false,
      message: `微信退款错误: ${error.message}`
    };
  }
};

module.exports = {
  createWechatPayment,
  getJsapiParameters,
  wechatPayNotify,
  queryWechatOrder,
  refundWechatPayment
}; 