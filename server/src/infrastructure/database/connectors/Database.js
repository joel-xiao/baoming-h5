const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('../../utils/helper/Logger');

// 加载环境变量
dotenv.config();

// 获取数据库类型
const dbType = process.env.DB_TYPE || 'mongodb';

// 文件系统数据存储路径
const DATA_DIR = path.join(__dirname, '../../../../data');

/**
 * 数据库连接管理器
 * 处理不同类型数据库的连接
 */
class Database {
  /**
   * MongoDB 连接
   * @returns {Promise<mongoose.Connection>} MongoDB连接对象
   */
  static async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MongoDB URI未定义，请检查环境变量');
      }
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      logger.info('MongoDB 连接成功');
      return mongoose.connection;
    } catch (error) {
      logger.error('MongoDB 连接失败: ' + error.message);
      throw error;
    }
  }

  /**
   * MySQL/Sequelize 连接
   * @returns {Promise<Sequelize>} Sequelize连接对象
   */
  static sequelize = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    {
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      dialect: 'mysql',
      logging: msg => logger.debug(msg)
    }
  );

  /**
   * 连接MySQL数据库
   * @returns {Promise<Sequelize>} Sequelize实例
   */
  static async connectMySQL() {
    try {
      await this.sequelize.authenticate();
      logger.info('MySQL 连接成功');
      return this.sequelize;
    } catch (error) {
      logger.error('MySQL 连接失败: ' + error.message);
      throw error;
    }
  }

  /**
   * 文件系统初始化
   * @returns {Promise<Object>} 文件系统存储信息
   */
  static async initFileSystem() {
    try {
      // 创建数据目录
      await fs.ensureDir(DATA_DIR);
      
      // 创建各种数据子目录
      const collections = ['registrations', 'payments', 'teams', 'admins', 'stats'];
      for (const collection of collections) {
        await fs.ensureDir(path.join(DATA_DIR, collection));
      }
      
      logger.info('文件系统存储初始化成功');
      return { dataDir: DATA_DIR };
    } catch (error) {
      logger.error('文件系统存储初始化失败: ' + error.message);
      throw error;
    }
  }

  /**
   * 根据配置连接适当的数据库
   * @returns {Promise<Object>} 数据库连接对象
   */
  static async connect() {
    switch (dbType) {
      case 'mongodb':
        return await this.connectMongoDB();
      case 'mysql':
        return await this.connectMySQL();
      case 'filesystem':
        return await this.initFileSystem();
      default:
        throw new Error(`不支持的数据库类型: ${dbType}`);
    }
  }
}

module.exports = {
  Database,
  dbType,
  mongoose,
  sequelize: Database.sequelize,
  DATA_DIR
}; 