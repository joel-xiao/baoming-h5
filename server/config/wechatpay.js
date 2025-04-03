const WechatPay = require('wechatpay-node-v3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// 检查环境变量
const requiredEnvVars = [
  'WECHAT_PAY_MCH_ID',
  'WECHAT_PAY_APP_ID',
  'WECHAT_PAY_NOTIFY_URL',
  'WECHAT_PAY_SERIAL_NUMBER'
];

let wechatPayConfig = null;

// 初始化微信支付
const initWechatPay = () => {
  try {
    // 检查是否启用模拟模式
    if (process.env.WECHAT_PAY_MOCK === 'true') {
      console.log('微信支付使用模拟模式');
      return createMockWechatPay();
    }
    
    // 检查必要的环境变量是否存在
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn(`缺少微信支付必要的环境变量: ${missingVars.join(', ')}`);
      return null;
    }
    
    // 检查证书文件是否存在
    const privateKeyPath = path.join(__dirname, '../certs/apiclient_key.pem');
    const certificatePath = path.join(__dirname, '../certs/apiclient_cert.pem');
    
    if (!fs.existsSync(privateKeyPath)) {
      console.warn('缺少微信支付私钥文件: apiclient_key.pem');
      return null;
    }
    
    if (!fs.existsSync(certificatePath)) {
      console.warn('缺少微信支付证书文件: apiclient_cert.pem');
      return null;
    }
    
    // 读取证书文件
    const privateKey = fs.readFileSync(privateKeyPath);
    const certificate = fs.readFileSync(certificatePath);
    
    // 创建微信支付配置
    const config = {
      mchid: process.env.WECHAT_PAY_MCH_ID,
      appid: process.env.WECHAT_PAY_APP_ID,
      publicKey: certificate,
      privateKey: privateKey,
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
      serialNumber: process.env.WECHAT_PAY_SERIAL_NUMBER
    };
    
    // 创建微信支付实例
    const wechatPay = new WechatPay(config);
    
    console.log('微信支付配置初始化成功');
    return wechatPay;
  } catch (error) {
    console.error('微信支付配置初始化失败:', error);
    return null;
  }
};

// 创建模拟的微信支付实例（开发环境使用）
const createMockWechatPay = () => {
  return {
    // 模拟JSAPI下单接口
    transactions_jsapi: async (params) => {
      console.log('模拟微信支付下单', params);
      return {
        prepay_id: `mock_prepay_${Date.now()}`
      };
    },
    
    // 模拟订单查询接口
    query: async (params) => {
      console.log('模拟查询微信支付订单', params);
      // 随机返回成功或等待中状态，便于测试
      const randomStatus = Math.random() > 0.3 ? 'SUCCESS' : 'NOTPAY';
      return {
        out_trade_no: params.out_trade_no,
        trade_state: randomStatus,
        transaction_id: `mock_transaction_${Date.now()}`,
        trade_state_desc: randomStatus === 'SUCCESS' ? '支付成功' : '待支付'
      };
    },
    
    // 模拟验证签名
    verifySign: (timestamp, nonce, body, signature) => {
      console.log('模拟验证微信支付回调签名');
      return true;
    },
    
    // 模拟解密数据
    decryptResource: (resource) => {
      console.log('模拟解密微信支付回调数据');
      return {
        out_trade_no: resource.ciphertext || `mock_order_${Date.now()}`,
        transaction_id: `mock_transaction_${Date.now()}`,
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        amount: {
          total: 9900,
          currency: 'CNY'
        }
      };
    },
    
    // 模拟生成签名
    getSignature: (params) => {
      console.log('模拟生成微信支付签名', params);
      return {
        appId: params.appId,
        timeStamp: params.timestamp,
        nonceStr: params.nonceStr,
        package: params.package,
        signType: 'RSA',
        paySign: `mock_sign_${Date.now()}`
      };
    }
  };
};

// 获取微信支付实例
const getWechatPay = () => {
  if (!wechatPayConfig) {
    wechatPayConfig = initWechatPay();
  }
  return wechatPayConfig;
};

// 生成随机字符串
const generateNonceStr = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// 获取JSAPI支付参数
const getJsapiPayParams = (prepayId) => {
  const wxpay = getWechatPay();
  if (!wxpay) {
    return null;
  }
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  
  return wxpay.getSignature({
    appId: process.env.WECHAT_PAY_APP_ID,
    timestamp,
    nonceStr,
    package: `prepay_id=${prepayId}`
  });
};

module.exports = {
  getWechatPay,
  generateNonceStr,
  getJsapiPayParams
}; 