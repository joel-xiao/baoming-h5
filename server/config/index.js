/**
 * 配置加载模块
 * 从config.json和环境变量加载配置
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 加载config.json
let fileConfig = {};
try {
  const configPath = path.join(__dirname, '../../config.json');
  if (fs.existsSync(configPath)) {
    fileConfig = require(configPath);
  }
} catch (error) {
  console.warn('无法加载config.json, 使用默认配置', error.message);
}

// 默认配置
const defaultConfig = {
  project: {
    name: '团队报名管理平台',
    description: '团队报名管理平台',
    version: '1.0.0'
  },
  database: {
    name: 'team_registration',
    uri: 'mongodb://localhost:27017/team_registration'
  },
  server: {
    port: 3001,
    host: 'localhost'
  },
  payment: {
    provider: 'wechat',
    mock: true
  }
};

// 从环境变量加载配置
const envConfig = {
  server: {
    port: process.env.PORT,
    host: process.env.HOST
  },
  database: {
    uri: process.env.DB_URI
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER,
    appId: process.env.PAYMENT_APP_ID,
    mchId: process.env.PAYMENT_MCH_ID,
    serialNumber: process.env.PAYMENT_SERIAL_NUMBER,
    notifyUrl: process.env.PAYMENT_NOTIFY_URL,
    mock: process.env.PAYMENT_MOCK === 'true'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  }
};

// 合并配置，优先级: 环境变量 > config.json > 默认配置
const mergeConfig = (target, source) => {
  for (const key in source) {
    if (source[key] !== null && source[key] !== undefined) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        mergeConfig(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
};

// 清理配置，移除undefined和null值
const cleanConfig = (obj) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === null || obj[key] === undefined) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      cleanConfig(obj[key]);
    }
  });
  return obj;
};

// 合并所有配置
const config = mergeConfig(
  mergeConfig({}, defaultConfig),
  mergeConfig(fileConfig, cleanConfig(JSON.parse(JSON.stringify(envConfig))))
);

module.exports = config; 