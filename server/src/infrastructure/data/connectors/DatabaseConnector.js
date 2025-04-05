const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 文件系统数据存储路径
const DATA_DIR = path.join(__dirname, '../../../../data');

/**
 * 数据库连接管理器
 * 处理不同类型数据库的连接
 */
class DatabaseConnector {
  /**
   * 构造函数
   * @param {Object} logger - 日志服务实例
   */
  constructor(logger) {
    this.logger = logger;
    // 获取数据库类型
    this.dbType = process.env.DB_TYPE || 'mongodb';
    
    // 创建Sequelize实例（如果数据库类型为mysql）
    if (this.dbType === 'mysql') {
      this.sequelize = new Sequelize(
        process.env.MYSQL_DATABASE,
        process.env.MYSQL_USER,
        process.env.MYSQL_PASSWORD,
        {
          host: process.env.MYSQL_HOST,
          port: process.env.MYSQL_PORT,
          dialect: 'mysql',
          logging: msg => this.logger.debug(msg)
        }
      );
    }
  }

  /**
   * 获取数据库类型
   * @returns {string} 数据库类型
   */
  getType() {
    return this.dbType;
  }

  /**
   * 获取Sequelize实例
   * @returns {Sequelize} Sequelize实例
   */
  getSequelize() {
    return this.sequelize;
  }

  /**
   * MongoDB 连接
   * @returns {Promise<mongoose.Connection>} MongoDB连接对象
   */
  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MongoDB URI未定义，请检查环境变量');
      }
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.logger.info('MongoDB 连接成功');
      return mongoose.connection;
    } catch (error) {
      this.logger.error('MongoDB 连接失败: ' + error.message);
      throw error;
    }
  }

  /**
   * 连接MySQL数据库
   * @returns {Promise<Sequelize>} Sequelize实例
   */
  async connectMySQL() {
    try {
      await this.sequelize.authenticate();
      this.logger.info('MySQL 连接成功');
      return this.sequelize;
    } catch (error) {
      this.logger.error('MySQL 连接失败: ' + error.message);
      throw error;
    }
  }

  /**
   * 文件系统初始化
   * @returns {Promise<Object>} 文件系统存储信息
   */
  async initFileSystem() {
    try {
      // 创建数据目录
      await fs.ensureDir(DATA_DIR);
      
      // 创建各种数据子目录
      const collections = ['registrations', 'payments', 'teams', 'admins', 'stats'];
      for (const collection of collections) {
        await fs.ensureDir(path.join(DATA_DIR, collection));
      }
      
      this.logger.info('文件系统存储初始化成功');
      return { dataDir: DATA_DIR };
    } catch (error) {
      this.logger.error('文件系统存储初始化失败: ' + error.message);
      throw error;
    }
  }

  /**
   * 根据配置连接适当的数据库
   * @returns {Promise<Object>} 数据库连接对象
   */
  async connect() {
    switch (this.dbType) {
      case 'mongodb':
        return await this.connectMongoDB();
      case 'mysql':
        return await this.connectMySQL();
      case 'filesystem':
        return await this.initFileSystem();
      default:
        throw new Error(`不支持的数据库类型: ${this.dbType}`);
    }
  }
  
  /**
   * 获取数据目录
   * @returns {string} 数据目录路径
   */
  getDataDir() {
    return DATA_DIR;
  }
}

module.exports = DatabaseConnector; 