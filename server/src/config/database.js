const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const path = require('path');

// 加载环境变量
dotenv.config();

// 数据库类型：mongodb, mysql, filesystem
const dbType = process.env.DB_TYPE || 'mongodb';

// MongoDB连接配置
const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/baoming',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  }
};

// MySQL连接配置
const sequelize = new Sequelize(
  process.env.MYSQL_DB || 'baoming',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 文件系统存储配置
const fileSystemConfig = {
  dataDir: path.join(__dirname, '../../data')
};

module.exports = {
  dbType,
  mongoConfig,
  sequelize,
  fileSystemConfig
}; 