/**
 * 前端配置文件
 * 直接从环境变量加载配置
 */

const config = {
  // 应用信息
  app: {
    title: process.env.VUE_APP_TITLE || '团队报名平台',
    version: process.env.VUE_APP_VERSION || '1.0.0'
  },
  
  // API配置
  api: {
    baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
    timeout: parseInt(process.env.VUE_APP_API_TIMEOUT || '30000', 10)
  },
  
  // 功能特性
  features: {
    offlineStorage: process.env.VUE_APP_FEATURE_OFFLINE_STORAGE === 'true',
    teamRegistration: process.env.VUE_APP_FEATURE_TEAM_REGISTRATION === 'true'
  },
  
  // 支付配置
  payment: {
    provider: process.env.VUE_APP_PAYMENT_PROVIDER || 'wechat'
  }
};

export default config; 