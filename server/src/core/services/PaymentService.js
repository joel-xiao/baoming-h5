const crypto = require('crypto');
const axios = require('axios');
const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;
const WechatPay = require('wechatpay-node-v3');
const appConfig = require('../../config/app');
const logger = require('../utils/Logger');

/**
 * 支付服务类
 * 处理微信支付和支付宝支付相关逻辑
 */
class PaymentService {
  constructor() {
    this.initWechatPay();
    this.initAlipay();
  }
  
  /**
   * 初始化微信支付SDK
   */
  initWechatPay() {
    try {
      if (
        appConfig.payment.wechatPay.appId &&
        appConfig.payment.wechatPay.mchId &&
        appConfig.payment.wechatPay.privateKey
      ) {
        this.wechatPayInstance = new WechatPay({
          appid: appConfig.payment.wechatPay.appId,
          mchid: appConfig.payment.wechatPay.mchId,
          publicKey: appConfig.payment.wechatPay.publicKey,
          privateKey: appConfig.payment.wechatPay.privateKey,
          key: appConfig.payment.wechatPay.key,
          serial_no: appConfig.payment.wechatPay.serialNo,
          authType: 'WECHATPAY2-SHA256-RSA2048'
        });
      } else {
        logger.warn('微信支付配置不完整，将不能使用微信支付功能');
        this.wechatPayInstance = null;
      }
    } catch (error) {
      logger.error(`初始化微信支付SDK错误: ${error.message}`);
      this.wechatPayInstance = null;
    }
  }
  
  /**
   * 初始化支付宝SDK
   */
  initAlipay() {
    try {
      if (
        appConfig.payment.alipay.appId &&
        appConfig.payment.alipay.privateKey
      ) {
        this.alipayInstance = new AlipaySdk({
          appId: appConfig.payment.alipay.appId,
          privateKey: appConfig.payment.alipay.privateKey,
          signType: 'RSA2',
          gateway: appConfig.payment.alipay.isDev ? 'https://openapi.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do',
          alipayPublicKey: appConfig.payment.alipay.publicKey,
          timeout: 5000
        });
      } else {
        logger.warn('支付宝配置不完整，将不能使用支付宝支付功能');
        this.alipayInstance = null;
      }
    } catch (error) {
      logger.error(`初始化支付宝SDK错误: ${error.message}`);
      this.alipayInstance = null;
    }
  }
  
  /**
   * 创建微信支付
   * @param {Object} options 支付选项
   * @returns {Promise<Object>} 支付结果
   */
  async createWechatPayment(options) {
    try {
      if (!this.wechatPayInstance) {
        throw new Error('微信支付未初始化');
      }
      
      const {
        orderNumber,
        amount,
        description,
        notifyUrl,
        openid
      } = options;
      
      // 创建支付参数
      const params = {
        description,
        out_trade_no: orderNumber,
        notify_url: notifyUrl,
        amount: {
          total: Math.round(amount * 100), // 转换为分
          currency: 'CNY'
        }
      };
      
      let result;
      
      // 根据是否有openid决定使用JSAPI支付还是Native支付
      if (openid) {
        // JSAPI支付
        params.payer = { openid };
        result = await this.wechatPayInstance.transactions_jsapi(params);
      } else {
        // Native支付（生成二维码）
        result = await this.wechatPayInstance.transactions_native(params);
      }
      
      if (result && result.status === 200) {
        const data = result.data;
        
        if (openid) {
          // JSAPI支付返回支付参数
          return {
            success: true,
            paymentUrl: null,
            paymentParams: data,
            message: '微信支付参数创建成功'
          };
        } else if (data.code_url) {
          // Native支付返回二维码链接
          return {
            success: true,
            paymentUrl: null,
            qrCode: data.code_url,
            message: '微信支付二维码创建成功'
          };
        }
      }
      
      throw new Error('微信支付创建失败');
    } catch (error) {
      logger.error(`创建微信支付错误: ${error.message}`);
      throw new Error(`创建微信支付失败: ${error.message}`);
    }
  }
  
  /**
   * 创建支付宝支付
   * @param {Object} options 支付选项
   * @returns {Promise<Object>} 支付结果
   */
  async createAlipayPayment(options) {
    try {
      if (!this.alipayInstance) {
        throw new Error('支付宝未初始化');
      }
      
      const {
        orderNumber,
        amount,
        subject,
        notifyUrl
      } = options;
      
      // 创建表单数据
      const formData = new AlipayFormData();
      
      // 设置支付宝支付参数
      formData.setMethod('alipay.trade.page.pay');
      formData.setCharset('utf-8');
      formData.setSignType('RSA2');
      formData.setNotifyUrl(notifyUrl);
      formData.setReturnUrl(appConfig.payment.alipay.returnUrl);
      
      // 设置业务参数
      const bizContent = {
        out_trade_no: orderNumber,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount.toFixed(2),
        subject,
        body: `订单号: ${orderNumber}`,
        timeout_express: '15m' // 15分钟超时
      };
      
      formData.addField('biz_content', JSON.stringify(bizContent));
      
      // 生成支付宝跳转链接
      const result = await this.alipayInstance.exec(
        'alipay.trade.page.pay',
        {},
        { formData: formData }
      );
      
      return {
        success: true,
        paymentUrl: result,
        qrCode: null,
        message: '支付宝支付链接创建成功'
      };
    } catch (error) {
      logger.error(`创建支付宝支付错误: ${error.message}`);
      throw new Error(`创建支付宝支付失败: ${error.message}`);
    }
  }
  
  /**
   * 解析微信支付回调
   * @param {Object} req Express请求对象
   * @returns {Promise<Object>} 解析结果
   */
  async parseWechatPayNotify(req) {
    try {
      if (!this.wechatPayInstance) {
        throw new Error('微信支付未初始化');
      }
      
      // 解析并验证微信支付回调
      const result = await this.wechatPayInstance.verifyNotify(req);
      
      // 验证支付状态
      if (result.event_type === 'TRANSACTION.SUCCESS') {
        const resource = result.resource;
        const decryptData = this.wechatPayInstance.decryptResource(resource);
        
        // 检查支付状态
        if (decryptData.trade_state === 'SUCCESS') {
          return {
            success: true,
            data: decryptData,
            message: '支付成功'
          };
        } else {
          return {
            success: false,
            message: `支付状态不正确: ${decryptData.trade_state}`
          };
        }
      } else {
        return {
          success: false,
          message: `事件类型不正确: ${result.event_type}`
        };
      }
    } catch (error) {
      logger.error(`解析微信支付回调错误: ${error.message}`);
      return {
        success: false,
        message: `解析微信支付回调失败: ${error.message}`
      };
    }
  }
  
  /**
   * 解析支付宝回调
   * @param {Object} data 回调数据
   * @returns {Promise<Object>} 解析结果
   */
  async parseAlipayNotify(data) {
    try {
      if (!this.alipayInstance) {
        throw new Error('支付宝未初始化');
      }
      
      // 验证签名
      const signVerified = await this.alipayInstance.checkNotifySign(data);
      
      if (!signVerified) {
        return {
          success: false,
          message: '支付宝回调签名验证失败'
        };
      }
      
      // 验证支付状态
      if (data.trade_status === 'TRADE_SUCCESS' || data.trade_status === 'TRADE_FINISHED') {
        return {
          success: true,
          data,
          message: '支付成功'
        };
      } else {
        return {
          success: false,
          message: `支付状态不正确: ${data.trade_status}`
        };
      }
    } catch (error) {
      logger.error(`解析支付宝回调错误: ${error.message}`);
      return {
        success: false,
        message: `解析支付宝回调失败: ${error.message}`
      };
    }
  }
  
  /**
   * 微信支付退款
   * @param {Object} options 退款选项
   * @returns {Promise<Object>} 退款结果
   */
  async refundWechatPayment(options) {
    try {
      if (!this.wechatPayInstance) {
        throw new Error('微信支付未初始化');
      }
      
      const {
        orderNumber,
        transactionId,
        totalAmount,
        refundAmount,
        reason
      } = options;
      
      // 退款参数
      const params = {
        out_trade_no: orderNumber,
        out_refund_no: `REFUND-${orderNumber}-${Date.now()}`,
        reason: reason || '用户申请退款',
        amount: {
          refund: Math.round(refundAmount * 100), // 转换为分
          total: Math.round(totalAmount * 100),
          currency: 'CNY'
        }
      };
      
      // 如果有交易号，优先使用交易号
      if (transactionId) {
        delete params.out_trade_no;
        params.transaction_id = transactionId;
      }
      
      // 发起退款请求
      const result = await this.wechatPayInstance.refunds(params);
      
      if (result && result.status === 200 && result.data.status === 'SUCCESS') {
        return {
          success: true,
          refundId: result.data.refund_id,
          message: '退款申请成功'
        };
      } else {
        throw new Error(`退款失败: ${result?.data?.status || '未知错误'}`);
      }
    } catch (error) {
      logger.error(`微信退款错误: ${error.message}`);
      throw new Error(`微信退款失败: ${error.message}`);
    }
  }
  
  /**
   * 支付宝退款
   * @param {Object} options 退款选项
   * @returns {Promise<Object>} 退款结果
   */
  async refundAlipayPayment(options) {
    try {
      if (!this.alipayInstance) {
        throw new Error('支付宝未初始化');
      }
      
      const {
        orderNumber,
        transactionId,
        refundAmount,
        reason
      } = options;
      
      // 退款参数
      const bizContent = {
        out_trade_no: orderNumber,
        refund_amount: refundAmount.toFixed(2),
        refund_reason: reason || '用户申请退款'
      };
      
      // 如果有交易号，优先使用交易号
      if (transactionId) {
        bizContent.trade_no = transactionId;
      }
      
      // 发起退款请求
      const result = await this.alipayInstance.exec(
        'alipay.trade.refund',
        {},
        { bizContent }
      );
      
      if (result.code === '10000' && result.msg === 'Success') {
        return {
          success: true,
          refundId: result.trade_no,
          message: '退款申请成功'
        };
      } else {
        throw new Error(`退款失败: ${result.sub_msg || result.msg || '未知错误'}`);
      }
    } catch (error) {
      logger.error(`支付宝退款错误: ${error.message}`);
      throw new Error(`支付宝退款失败: ${error.message}`);
    }
  }
  
  /**
   * 查询微信支付订单
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async queryWechatPayment(options) {
    try {
      if (!this.wechatPayInstance) {
        throw new Error('微信支付未初始化');
      }
      
      const { orderNumber, transactionId } = options;
      
      let result;
      
      // 根据交易号或订单号查询
      if (transactionId) {
        result = await this.wechatPayInstance.query({ transaction_id: transactionId });
      } else {
        result = await this.wechatPayInstance.query({ out_trade_no: orderNumber });
      }
      
      if (result && result.status === 200) {
        return {
          success: true,
          data: result.data,
          message: '查询成功'
        };
      } else {
        throw new Error('查询失败');
      }
    } catch (error) {
      logger.error(`查询微信支付订单错误: ${error.message}`);
      return {
        success: false,
        message: `查询微信支付订单失败: ${error.message}`
      };
    }
  }
  
  /**
   * 查询支付宝订单
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async queryAlipayPayment(options) {
    try {
      if (!this.alipayInstance) {
        throw new Error('支付宝未初始化');
      }
      
      const { orderNumber, transactionId } = options;
      
      // 查询参数
      const bizContent = {};
      
      // 根据交易号或订单号查询
      if (transactionId) {
        bizContent.trade_no = transactionId;
      } else {
        bizContent.out_trade_no = orderNumber;
      }
      
      // 发起查询请求
      const result = await this.alipayInstance.exec(
        'alipay.trade.query',
        {},
        { bizContent }
      );
      
      if (result.code === '10000') {
        return {
          success: true,
          data: result,
          message: '查询成功'
        };
      } else {
        throw new Error(`查询失败: ${result.sub_msg || result.msg || '未知错误'}`);
      }
    } catch (error) {
      logger.error(`查询支付宝订单错误: ${error.message}`);
      return {
        success: false,
        message: `查询支付宝订单失败: ${error.message}`
      };
    }
  }
}

module.exports = {
  PaymentService
}; 