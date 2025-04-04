/**
 * 全面数据库修复脚本
 * 修复orderNo为null的记录，处理索引问题等
 */

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const dbConfig = require('../config/database');
const IDGenerator = require('../core/utils/IDGenerator');
const logger = require('../core/utils/Logger');

// 连接字符串
const { mongoConfig } = dbConfig;
const uri = mongoConfig.uri;

async function fixDatabase() {
  console.log('开始修复数据库问题...');
  
  try {
    // 使用原生MongoDB客户端连接，以便执行更底层的操作
    const client = new MongoClient(uri);
    await client.connect();
    console.log('成功连接到MongoDB数据库');
    
    const db = client.db();
    const registrationCollection = db.collection('registrations');
    
    // 1. 修复null orderNo问题
    console.log('开始修复orderNo为null的记录...');
    
    const nullOrderRecords = await registrationCollection.find({ 
      $or: [
        { orderNo: null },
        { orderNo: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`找到${nullOrderRecords.length}条orderNo为null或不存在的记录`);
    
    let fixedCount = 0;
    const bulkOps = [];
    
    // 准备批量更新操作
    for (const record of nullOrderRecords) {
      // 根据记录类型生成订单号
      let orderNo;
      if (record.members && record.members.length > 0) {
        orderNo = IDGenerator.generateRegistrationOrderId();
      } else {
        orderNo = IDGenerator.generateTeamOrderId();
      }
      
      // 添加到批量操作中
      bulkOps.push({
        updateOne: {
          filter: { _id: record._id },
          update: { $set: { orderNo: orderNo } }
        }
      });
      
      console.log(`准备修复记录 _id: ${record._id}, 设置 orderNo: ${orderNo}`);
      fixedCount++;
    }
    
    // 执行批量更新
    if (bulkOps.length > 0) {
      const result = await registrationCollection.bulkWrite(bulkOps);
      console.log(`成功更新了${result.modifiedCount}条记录`);
    } else {
      console.log('没有需要更新的记录');
    }
    
    // 检查索引情况
    console.log('检查数据库索引情况...');
    
    const indexes = await registrationCollection.indexes();
    console.log('当前集合索引:');
    console.log(indexes);
    
    // 2. 处理idCard字段问题
    console.log('开始处理idCard字段问题...');
    
    // 检查是否存在idCard唯一索引
    const hasIdCardUniqueIndex = indexes.some(index => 
      index.key && index.key.idCard === 1 && index.unique === true
    );
    
    if (hasIdCardUniqueIndex) {
      console.log('发现idCard字段的唯一索引，准备删除...');
      try {
        await registrationCollection.dropIndex('idCard_1');
        console.log('成功删除idCard唯一索引');
      } catch (indexError) {
        console.error('删除idCard唯一索引时出错:', indexError.message);
      }
    } else {
      console.log('idCard没有唯一索引，无需处理');
    }
    
    // 3. 检查orderNo唯一索引
    // 检查orderNo是否有唯一索引
    const hasOrderNoUniqueIndex = indexes.some(index => 
      index.key && index.key.orderNo === 1 && index.unique === true
    );
    
    if (!hasOrderNoUniqueIndex) {
      console.log('orderNo字段缺少唯一索引，准备创建...');
      await registrationCollection.createIndex({ orderNo: 1 }, { unique: true });
      console.log('成功为orderNo字段创建唯一索引');
    } else {
      console.log('orderNo已有唯一索引，无需创建');
    }
    
    console.log('数据库修复完成!');
    await client.close();
    
  } catch (error) {
    console.error('修复数据库时出错:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// 立即执行修复操作
fixDatabase()
  .then(() => {
    console.log('数据库修复程序执行完毕');
    process.exit(0);
  })
  .catch(err => {
    console.error('执行过程中发生严重错误:', err);
    process.exit(1);
  });

// 处理程序终止信号
process.on('SIGINT', () => {
  console.log('修复程序被中断');
  process.exit(0);
}); 