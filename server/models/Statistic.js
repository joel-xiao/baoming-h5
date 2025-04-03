const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 定义Schema
const StatisticSchema = new mongoose.Schema({
  viewCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// 存储路径，用于文件存储备选方案
const dataDir = path.join(__dirname, '../data');
const statsFile = path.join(dataDir, 'statistics.json');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('创建数据目录成功:', dataDir);
  } catch (err) {
    console.error('创建数据目录失败:', err);
  }
}

// 如果统计文件不存在，创建初始文件
if (!fs.existsSync(statsFile)) {
  try {
    fs.writeFileSync(statsFile, JSON.stringify({ viewCount: 0, lastUpdated: new Date() }));
    console.log('创建统计初始文件成功:', statsFile);
  } catch (err) {
    console.error('创建统计初始文件失败:', err);
  }
}

// 首先尝试使用MongoDB模型
let MongoStatisticModel;
try {
  MongoStatisticModel = mongoose.model('Statistic', StatisticSchema);
  console.log('Statistic MongoDB模型创建成功');
} catch (error) {
  console.log('创建Mongoose模型时出错，将使用已存在的模型:', error.message);
  try {
    MongoStatisticModel = mongoose.model('Statistic');
    console.log('使用已存在的Statistic模型');
  } catch (modelError) {
    console.error('获取Statistic模型失败:', modelError);
    MongoStatisticModel = null;
  }
}

// 创建文件存储备选方案
const FileStatisticModel = {
  findOne: async function() {
    try {
      if (fs.existsSync(statsFile)) {
        const data = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        console.log('读取统计文件成功:', data);
        return data;
      } else {
        console.log('统计文件不存在，返回默认值');
        return { viewCount: 0, lastUpdated: new Date() };
      }
    } catch (error) {
      console.error('读取统计数据失败:', error);
      return { viewCount: 0, lastUpdated: new Date() };
    }
  },
  
  findOneAndUpdate: async function(filter, update, options) {
    try {
      // 先读取现有数据
      let data = await this.findOne();
      
      console.log('文件存储 - 更新浏览量，当前数据:', data);
      console.log('文件存储 - 更新操作:', update);
      
      // 应用更新
      if (update.$inc && update.$inc.viewCount) {
        data.viewCount += update.$inc.viewCount;
      }
      
      if (update.$set) {
        Object.assign(data, update.$set);
      }
      
      // 更新时间
      data.lastUpdated = new Date();
      
      // 写入文件
      fs.writeFileSync(statsFile, JSON.stringify(data, null, 2));
      console.log('更新统计文件成功，新数据:', data);
      
      return data;
    } catch (error) {
      console.error('更新统计数据失败:', error);
      return { viewCount: 0, lastUpdated: new Date() };
    }
  },
  
  create: async function(data) {
    try {
      fs.writeFileSync(statsFile, JSON.stringify({
        viewCount: data.viewCount || 0,
        lastUpdated: new Date()
      }, null, 2));
      console.log('创建统计数据成功:', data);
      return this.findOne();
    } catch (error) {
      console.error('创建统计数据失败:', error);
      return { viewCount: 0, lastUpdated: new Date() };
    }
  }
};

// 创建混合模型，尝试使用MongoDB，失败则回退到文件存储
const StatisticModel = {
  findOne: async function(filter = {}) {
    try {
      if (MongoStatisticModel) {
        console.log('使用MongoDB查询统计数据');
        const doc = await MongoStatisticModel.findOne(filter).exec();
        if (doc) {
          console.log('MongoDB查询成功:', doc);
          return doc;
        } else {
          console.log('MongoDB中未找到统计数据，创建默认值');
          return await this.create({ viewCount: 0 });
        }
      } else {
        console.log('MongoDB不可用，使用文件存储查询');
        return await FileStatisticModel.findOne();
      }
    } catch (error) {
      console.error('MongoDB查询失败，使用文件存储作为备选:', error);
      return await FileStatisticModel.findOne();
    }
  },
  
  findOneAndUpdate: async function(filter = {}, update, options = {}) {
    try {
      if (MongoStatisticModel) {
        console.log('使用MongoDB更新统计数据');
        const updatedDoc = await MongoStatisticModel.findOneAndUpdate(
          filter,
          update,
          { new: true, upsert: true, ...options }
        ).exec();
        console.log('MongoDB更新成功:', updatedDoc);
        return updatedDoc;
      } else {
        console.log('MongoDB不可用，使用文件存储更新');
        return await FileStatisticModel.findOneAndUpdate(filter, update, options);
      }
    } catch (error) {
      console.error('MongoDB更新失败，使用文件存储作为备选:', error);
      return await FileStatisticModel.findOneAndUpdate(filter, update, options);
    }
  },
  
  create: async function(data) {
    try {
      if (MongoStatisticModel) {
        console.log('使用MongoDB创建统计数据');
        const newDoc = await MongoStatisticModel.create(data);
        console.log('MongoDB创建成功:', newDoc);
        return newDoc;
      } else {
        console.log('MongoDB不可用，使用文件存储创建');
        return await FileStatisticModel.create(data);
      }
    } catch (error) {
      console.error('MongoDB创建失败，使用文件存储作为备选:', error);
      return await FileStatisticModel.create(data);
    }
  }
};

module.exports = StatisticModel; 