const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 数据库连接函数
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB连接成功');
    return true;
  } catch (err) {
    console.error('MongoDB连接失败:', err);
    console.log('将使用本地文件存储作为备选方案');
    
    // 设置文件存储的路径
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
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