const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../../../../../config/app');
const logger = require('../../../../../infrastructure/utils/helper/Logger');

/**
 * 支付宝支付服务
 * 处理与支付宝支付API的交互
 */
class AlipayService {
  constructor() {
    this.config = config.alipay;
    this.baseUrl = 'https://openapi.alipay.com/gateway.do';
    this.appId = this.config.appId;
    this.privateKey = this.config.privateKey;
    this.publicKey = this.config.publicKey;
    this.notifyUrl = this.config.notifyUrl;
  }

  /**
   * 创建支付宝支付订单
   * @param {Object} orderData 订单数据
   * @returns {Promise<Object>} 支付结果
   */
  async createPayment(orderData) {
    try {
      const { orderNumber, amount, teamName } = orderData;
      
      // 构建请求参数
      const bizContent = {
        out_trade_no: orderNumber,
        total_amount: amount.toString(),
        subject: `报名费: ${teamName}`,
        product_code: 'FAST_INSTANT_TRADE_PAY'
      };
      
      // 基础参数
      const params = {
        app_id: this.appId,
        method: 'alipay.trade.page.pay',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: this._formatDate(new Date()),
        version: '1.0',
        notify_url: this.notifyUrl,
        biz_content: JSON.stringify(bizContent)
      };
      
      // 签名
      const sign = this._generateSign(params);
      params.sign = sign;
      
      // 构建支付URL
      const queryParams = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const paymentUrl = `${this.baseUrl}?${queryParams}`;
      
      logger.info(`支付宝支付订单创建成功: ${orderNumber}, 金额: ${amount}`);
      
      return {
        success: true,
        paymentUrl,
        qrCode: null // 支付宝默认使用跳转链接，不生成二维码
      };
    } catch (error) {
      logger.error(`创建支付宝支付失败: ${error.message}`);
      return {
        success: false,
        message: `创建支付宝支付失败: ${error.message}`
      };
    }
  }

  /**
   * 查询支付宝订单状态
   * @param {String} orderNumber 订单号
   * @returns {Promise<Object>} 查询结果
   */
  async queryOrder(orderNumber) {
    try {
      // 构建请求参数
      const bizContent = {
        out_trade_no: orderNumber
      };
      
      // 基础参数
      const params = {
        app_id: this.appId,
        method: 'alipay.trade.query',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: this._formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent)
      };
      
      // 签名
      const sign = this._generateSign(params);
      params.sign = sign;
      
      // 发送请求
      const response = await axios.post(this.baseUrl, null, {
        params
      });
      
      const data = response.data;
      const responseKey = 'alipay_trade_query_response';
      
      if (data[responseKey].code !== '10000') {
        return {
          success: false,
          message: data[responseKey].msg
        };
      }
      
      return {
        success: true,
        data: data[responseKey]
      };
    } catch (error) {
      logger.error(`查询支付宝订单失败: ${error.message}`);
      return {
        success: false,
        message: `查询支付宝订单失败: ${error.message}`
      };
    }
  }

  /**
   * 申请退款
   * @param {Object} refundData 退款数据
   * @returns {Promise<Object>} 退款结果
   */
  async refundPayment(refundData) {
    try {
      const { orderNumber, transactionId, refundAmount, reason } = refundData;
      
      // 构建请求参数
      const bizContent = {
        out_trade_no: orderNumber,
        refund_amount: refundAmount.toString(),
        refund_reason: reason || '用户申请退款'
      };
      
      // 如果有支付宝交易号，优先使用
      if (transactionId) {
        bizContent.trade_no = transactionId;
      }
      
      // 基础参数
      const params = {
        app_id: this.appId,
        method: 'alipay.trade.refund',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: this._formatDate(new Date()),
        version: '1.0',
        biz_content: JSON.stringify(bizContent)
      };
      
      // 签名
      const sign = this._generateSign(params);
      params.sign = sign;
      
      // 发送请求
      const response = await axios.post(this.baseUrl, null, {
        params
      });
      
      const data = response.data;
      const responseKey = 'alipay_trade_refund_response';
      
      if (data[responseKey].code !== '10000') {
        return {
          success: false,
          message: data[responseKey].msg
        };
      }
      
      logger.info(`支付宝退款成功: ${orderNumber}, 退款金额: ${refundAmount}, 退款单号: ${data[responseKey].trade_no}`);
      
      return {
        success: true,
        refundId: `ALIPAY-REFUND-${Date.now()}`,
        status: 'SUCCESS'
      };
    } catch (error) {
      logger.error(`支付宝退款失败: ${error.message}`);
      return {
        success: false,
        message: `支付宝退款失败: ${error.message}`
      };
    }
  }

  /**
   * 验证支付宝回调
   * @param {Object} data 回调数据
   * @returns {Promise<Object>} 验证结果
   */
  async verifyNotify(data) {
    try {
      // 提取签名
      const sign = data.sign;
      const signType = data.sign_type;
      
      // 删除签名相关字段
      const params = { ...data };
      delete params.sign;
      delete params.sign_type;
      
      // 按照字母顺序排序对象的键
      const sortedKeys = Object.keys(params).sort();
      
      // 构建待验签的字符串
      const stringToSign = sortedKeys
        .map(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            return `${key}=${params[key]}`;
          }
          return '';
        })
        .filter(pair => pair !== '')
        .join('&');
      
      // 验证签名
      const verified = this._verifySign(stringToSign, sign, signType);
      
      if (!verified) {
        return {
          success: false,
          message: '签名验证失败'
        };
      }
      
      // 检查支付状态
      if (data.trade_status !== 'TRADE_SUCCESS' && data.trade_status !== 'TRADE_FINISHED') {
        return {
          success: false,
          message: `支付未成功，状态: ${data.trade_status}`
        };
      }
      
      return {
        success: true,
        data: {
          out_trade_no: data.out_trade_no,
          trade_no: data.trade_no,
          total_amount: data.total_amount,
          gmt_payment: data.gmt_payment
        }
      };
    } catch (error) {
      logger.error(`验证支付宝回调失败: ${error.message}`);
      return {
        success: false,
        message: `验证支付宝回调失败: ${error.message}`
      };
    }
  }

  /**
   * 格式化日期为支付宝要求的格式
   * @param {Date} date 日期对象
   * @returns {String} 格式化后的日期字符串
   */
  _formatDate(date) {
    const pad = (num) => (num < 10 ? `0${num}` : num);
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  /**
   * 生成签名
   * @param {Object} params 需要签名的参数
   * @returns {String} 签名
   */
  _generateSign(params) {
    // 按照字母顺序排序对象的键
    const sortedKeys = Object.keys(params).sort();
    
    // 构建待签名的字符串
    const stringToSign = sortedKeys
      .map(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          return `${key}=${params[key]}`;
        }
        return '';
      })
      .filter(pair => pair !== '')
      .join('&');
    
    // 使用私钥签名
    const sign = crypto.createSign('RSA-SHA256')
      .update(stringToSign)
      .sign(this.privateKey, 'base64');
    
    return sign;
  }

  /**
   * 验证签名
   * @param {String} content 待验签内容
   * @param {String} sign 签名
   * @param {String} signType 签名类型
   * @returns {Boolean} 验证结果
   */
  _verifySign(content, sign, signType = 'RSA2') {
    try {
      const verify = crypto.createVerify(signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1');
      verify.update(content);
      return verify.verify(this.publicKey, sign, 'base64');
    } catch (error) {
      logger.error(`验签失败: ${error.message}`);
      return false;
    }
  }
}

module.exports = AlipayService; 