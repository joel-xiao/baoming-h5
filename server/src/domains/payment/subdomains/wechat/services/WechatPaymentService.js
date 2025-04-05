const crypto = require('crypto');
const axios = require('axios');
const config = require('../../../../../config/app');
const logger = require('../../../../../infrastructure/utils/helper/Logger');

/**
 * 微信支付服务
 * 处理与微信支付API的交互
 */
class WechatPaymentService {
  constructor() {
    this.config = config.wechatPay;
    this.baseUrl = 'https://api.mch.weixin.qq.com';
  }

  /**
   * 创建微信支付订单
   * @param {Object} orderData 订单数据
   * @returns {Promise<Object>} 支付结果
   */
  async createPayment(orderData) {
    try {
      const { orderNumber, amount, teamName, openid } = orderData;
      
      // 根据是否有openid决定使用JSAPI支付还是Native支付
      const tradeType = openid ? 'JSAPI' : 'NATIVE';
      
      // 构建请求数据
      const data = {
        appid: this.config.appId,
        mchid: this.config.mchId,
        out_trade_no: orderNumber,
        description: `报名费: ${teamName}`,
        notify_url: this.config.notifyUrl,
        amount: {
          total: Math.round(amount * 100), // 转换为分
          currency: 'CNY'
        }
      };
      
      // 如果是JSAPI支付，需要添加payer.openid
      if (tradeType === 'JSAPI') {
        data.payer = {
          openid: openid
        };
      }
      
      // 签名请求
      const timestamp = Math.floor(Date.now() / 1000);
      const nonceStr = this._generateNonce();
      
      const signature = await this._generateSignature('POST', '/v3/pay/transactions/jsapi', timestamp, nonceStr, data);
      
      // 发送请求
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v3/pay/transactions/${tradeType.toLowerCase()}`,
        data: data,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.config.serialNo}"`
        }
      });
      
      logger.info(`微信支付订单创建成功: ${orderNumber}, 金额: ${amount}, 类型: ${tradeType}`);
      
      // 处理响应
      let result = {
        success: true
      };
      
      if (tradeType === 'JSAPI') {
        // JSAPI支付返回prepay_id
        result.prepayId = response.data.prepay_id;
        result.paymentUrl = null;
      } else {
        // Native支付返回二维码链接
        result.paymentUrl = response.data.code_url;
        result.qrCode = response.data.code_url;
      }
      
      return result;
    } catch (error) {
      logger.error(`创建微信支付失败: ${error.message}`);
      return {
        success: false,
        message: `创建微信支付失败: ${error.message}`
      };
    }
  }

  /**
   * 获取JSAPI支付参数
   * @param {String} prepayId 预支付ID
   * @returns {Object} JSAPI支付参数
   */
  async getJsapiParameters(prepayId) {
    try {
      const appId = this.config.appId;
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = this._generateNonce();
      
      // 按照官方文档，构建签名字符串
      const message = `${appId}\n${timestamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
      const signature = this._sign(message);
      
      return {
        appId,
        timeStamp: timestamp,
        nonceStr,
        package: `prepay_id=${prepayId}`,
        signType: 'RSA',
        paySign: signature
      };
    } catch (error) {
      logger.error(`获取JSAPI支付参数失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查询微信支付订单状态
   * @param {String} orderNumber 订单号
   * @returns {Promise<Object>} 查询结果
   */
  async queryOrder(orderNumber) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonceStr = this._generateNonce();
      
      const signature = await this._generateSignature('GET', `/v3/pay/transactions/out-trade-no/${orderNumber}?mchid=${this.config.mchId}`, timestamp, nonceStr);
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/v3/pay/transactions/out-trade-no/${orderNumber}?mchid=${this.config.mchId}`,
        headers: {
          'Accept': 'application/json',
          'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.config.serialNo}"`
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`查询微信支付订单失败: ${error.message}`);
      return {
        success: false,
        message: `查询微信支付订单失败: ${error.message}`
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
      const { orderNumber, transactionId, totalAmount, refundAmount, reason } = refundData;
      
      // 构建请求数据
      const data = {
        out_trade_no: orderNumber,
        out_refund_no: `REFUND-${orderNumber}-${Date.now()}`,
        reason: reason || '用户申请退款',
        amount: {
          refund: Math.round(refundAmount * 100), // 转换为分
          total: Math.round(totalAmount * 100),
          currency: 'CNY'
        }
      };
      
      // 如果有transactionId，优先使用
      if (transactionId && !transactionId.startsWith('PENDING-')) {
        delete data.out_trade_no;
        data.transaction_id = transactionId;
      }
      
      // 签名请求
      const timestamp = Math.floor(Date.now() / 1000);
      const nonceStr = this._generateNonce();
      
      const signature = await this._generateSignature('POST', '/v3/refund/domestic/refunds', timestamp, nonceStr, data);
      
      // 发送请求
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v3/refund/domestic/refunds`,
        data: data,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.config.serialNo}"`
        }
      });
      
      logger.info(`微信支付退款成功: ${orderNumber}, 退款金额: ${refundAmount}, 退款单号: ${response.data.out_refund_no}`);
      
      return {
        success: true,
        refundId: response.data.out_refund_no,
        status: response.data.status
      };
    } catch (error) {
      logger.error(`微信支付退款失败: ${error.message}`);
      return {
        success: false,
        message: `微信支付退款失败: ${error.message}`
      };
    }
  }

  /**
   * 验证微信支付回调
   * @param {Object} req 请求对象
   * @returns {Promise<Object>} 验证结果
   */
  async verifyNotify(req) {
    try {
      // 获取请求头中的签名相关信息
      const signature = req.headers['wechatpay-signature'];
      const timestamp = req.headers['wechatpay-timestamp'];
      const nonce = req.headers['wechatpay-nonce'];
      const serialNo = req.headers['wechatpay-serial'];
      
      if (!signature || !timestamp || !nonce || !serialNo) {
        return {
          success: false,
          message: '缺少验签参数'
        };
      }
      
      // 获取请求体数据
      const body = JSON.stringify(req.body);
      
      // 构建验签字符串
      const message = `${timestamp}\n${nonce}\n${body}\n`;
      
      // 验证签名
      const verified = this._verifySignature(message, signature, serialNo);
      
      if (!verified) {
        return {
          success: false,
          message: '签名验证失败'
        };
      }
      
      // 解密回调数据中的敏感信息
      const resource = req.body.resource;
      const decryptedData = this._decryptResource(resource);
      
      return {
        success: true,
        data: decryptedData
      };
    } catch (error) {
      logger.error(`验证微信支付回调失败: ${error.message}`);
      return {
        success: false,
        message: `验证微信支付回调失败: ${error.message}`
      };
    }
  }

  /**
   * 生成随机字符串
   * @returns {String} 随机字符串
   */
  _generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 生成签名
   * @param {String} method HTTP方法
   * @param {String} url 请求路径
   * @param {Number} timestamp 时间戳
   * @param {String} nonceStr 随机字符串
   * @param {Object} body 请求体
   * @returns {String} 签名
   */
  async _generateSignature(method, url, timestamp, nonceStr, body = '') {
    const bodyStr = body ? JSON.stringify(body) : '';
    const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
    
    return this._sign(message);
  }

  /**
   * 签名方法
   * @param {String} message 待签名消息
   * @returns {String} 签名结果
   */
  _sign(message) {
    // 实际生产环境中，这里应该使用商户私钥进行签名
    // 这里简化处理，假设私钥已经被正确加载
    const privateKey = this.config.privateKey;
    
    const signature = crypto.createSign('RSA-SHA256')
      .update(message)
      .sign(privateKey, 'base64');
    
    return signature;
  }

  /**
   * 验证签名
   * @param {String} message 验签消息
   * @param {String} signature 签名
   * @param {String} serialNo 证书序列号
   * @returns {Boolean} 验证结果
   */
  _verifySignature(message, signature, serialNo) {
    // 实际生产环境中，这里应该根据序列号获取对应的微信支付平台证书
    // 这里简化处理，假设已经获取了正确的证书
    const publicKey = this.config.platformCertificate;
    
    return crypto.createVerify('RSA-SHA256')
      .update(message)
      .verify(publicKey, signature, 'base64');
  }

  /**
   * 解密资源数据
   * @param {Object} resource 资源数据
   * @returns {Object} 解密后的数据
   */
  _decryptResource(resource) {
    const { ciphertext, associated_data, nonce } = resource;
    
    // 解密，使用AEAD_AES_256_GCM算法
    const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
    const authTag = ciphertextBuffer.slice(ciphertextBuffer.length - 16);
    const data = ciphertextBuffer.slice(0, ciphertextBuffer.length - 16);
    
    const key = Buffer.from(this.config.apiV3Key, 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf8'));
    
    decipher.setAuthTag(authTag);
    if (associated_data) {
      decipher.setAAD(Buffer.from(associated_data, 'utf8'));
    }
    
    const decryptedBuffer = Buffer.concat([
      decipher.update(data),
      decipher.final()
    ]);
    
    return JSON.parse(decryptedBuffer.toString('utf8'));
  }
}

module.exports = WechatPaymentService; 