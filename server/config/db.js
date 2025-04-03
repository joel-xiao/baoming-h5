const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 数据库连接函数
const connectDB = async () => {
  try {
    console.log('正在连接MongoDB数据库...');
    console.log('MongoDB连接URI:', process.env.MONGODB_URI);
    
    // 设置MongoDB连接参数，增加超时时间
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,   // 增加服务器选择超时到5秒
      connectTimeoutMS: 10000,          // 连接超时增加到10秒
      socketTimeoutMS: 45000,           // socket超时增加到45秒
      family: 4,                        // 强制使用IPv4
      maxPoolSize: 10,                  // 最大连接池大小
      retryWrites: true,                // 启用重试写入
      retryReads: true                  // 启用重试读取
    });
    
    console.log('MongoDB连接成功');
    return true;
  } catch (err) {
    console.error('MongoDB连接失败:', err);
    console.log('将使用本地文件存储作为备选方案');
    
    // 设置文件存储的路径
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 覆盖Registration模型的方法，使用文件存储
    const Registration = require('../models/Registration');
    const registrationsFile = path.join(dataDir, 'registrations.json');
    
    // 初始化存储文件
    if (!fs.existsSync(registrationsFile)) {
      fs.writeFileSync(registrationsFile, JSON.stringify([]));
    }
    
    // 重写Registration模型的静态方法
    Registration.find = async function(query = {}) {
      try {
        const data = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
        // 简单过滤逻辑
        return data.filter(item => {
          if (Object.keys(query).length === 0) return true;
          return Object.keys(query).every(key => {
            if (query[key] instanceof RegExp) {
              return query[key].test(item[key]);
            }
            return item[key] === query[key];
          });
        });
      } catch (error) {
        console.error('读取注册数据失败:', error);
        return [];
      }
    };
    
    // 添加findOne方法实现
    Registration.findOne = async function(query = {}) {
      try {
        const data = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
        // 查找第一个匹配的记录
        return data.find(item => {
          return Object.keys(query).every(key => {
            if (query[key] instanceof RegExp) {
              return query[key].test(item[key]);
            }
            return item[key] === query[key];
          });
        }) || null;
      } catch (error) {
        console.error('查找注册数据失败:', error);
        return null;
      }
    };
    
    Registration.create = async function(data) {
      try {
        const registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
        const newRegistration = {
          ...data,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        registrations.push(newRegistration);
        fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));
        return newRegistration;
      } catch (error) {
        console.error('保存注册数据失败:', error);
        throw error;
      }
    };
    
    // 添加save方法到原型上
    Registration.prototype.save = async function() {
      try {
        const registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
        
        // 如果是新记录
        if (!this._id) {
          this._id = Date.now().toString();
          this.createdAt = new Date().toISOString();
          this.updatedAt = new Date().toISOString();
          registrations.push(this);
        } else {
          // 更新现有记录
          const index = registrations.findIndex(item => item._id === this._id);
          if (index !== -1) {
            this.updatedAt = new Date().toISOString();
            registrations[index] = this;
          } else {
            throw new Error('未找到要更新的记录');
          }
        }
        
        fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));
        return this;
      } catch (error) {
        console.error('保存注册数据失败:', error);
        throw error;
      }
    };
    
    Registration.findOneAndUpdate = async function(query, update) {
      try {
        const registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
        const index = registrations.findIndex(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });
        
        if (index !== -1) {
          const updatedRegistration = {
            ...registrations[index],
            ...update.$set,
            updatedAt: new Date().toISOString()
          };
          registrations[index] = updatedRegistration;
          fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));
          return updatedRegistration;
        }
        return null;
      } catch (error) {
        console.error('更新注册数据失败:', error);
        throw error;
      }
    };
    
    Registration.countDocuments = async function() {
      try {
        const registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
        return registrations.length;
      } catch (error) {
        console.error('统计注册数据失败:', error);
        return 0;
      }
    };
    
    return false;
  }
};

module.exports = connectDB; 