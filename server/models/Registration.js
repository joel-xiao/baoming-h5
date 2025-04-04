const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  openid: {
    type: String,
    required: true
  },
  isTeamLeader: {
    type: Boolean,
    default: false
  },
  teamId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 99
  },
  orderNo: {
    type: String,
    unique: true
  },
  transactionId: {
    type: String,
    default: null
  },
  prepayId: {
    type: String,
    default: null
  },
  paymentTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 添加更丰富的索引
// 单字段索引
RegistrationSchema.index({ orderNo: 1 }, { unique: true });
RegistrationSchema.index({ openid: 1 });
RegistrationSchema.index({ paymentStatus: 1 });
RegistrationSchema.index({ createdAt: -1 });
RegistrationSchema.index({ isTeamLeader: 1 });
RegistrationSchema.index({ teamId: 1 });

// 组合索引，用于常见的联合查询场景
RegistrationSchema.index({ paymentStatus: 1, createdAt: -1 });
RegistrationSchema.index({ isTeamLeader: 1, paymentStatus: 1 });

// 添加静态方法，简化常见查询并应用优化
RegistrationSchema.statics.findSuccessful = function() {
  return this.find({ paymentStatus: 'success' }).lean().sort({ createdAt: -1 });
};

RegistrationSchema.statics.findTeamLeaders = function() {
  return this.find({ isTeamLeader: true }).lean().sort({ createdAt: -1 });
};

RegistrationSchema.statics.findByTeam = function(teamId) {
  return this.find({ teamId }).lean().sort({ createdAt: -1 });
};

// 添加兼容的聚合方法，防止在文件存储模式下出错
RegistrationSchema.statics.safeAggregate = async function(pipeline) {
  try {
    if (typeof this.aggregate === 'function') {
      return await this.aggregate(pipeline);
    } else {
      console.log('聚合方法不可用，使用兼容模式');
      // 简单实现仅支持最基本的match+group聚合
      const results = await this.find(pipeline[0]?.$match || {}).lean();
      
      if (!pipeline[1]?.$group) {
        return results;
      }
      
      // 非常简化的聚合模拟
      const group = pipeline[1].$group;
      const returnObj = {
        _id: group._id
      };
      
      // 计算count
      if (group.totalCount) {
        returnObj.totalCount = results.length;
      }
      
      // 计算isTeamLeader计数
      if (group.teamLeaderCount) {
        returnObj.teamLeaderCount = results.filter(r => r.isTeamLeader === true).length;
      }
      
      // 计算金额总和
      if (group.totalAmount) {
        returnObj.totalAmount = results.reduce((sum, r) => {
          return sum + (Number(r.paymentAmount) || 0);
        }, 0);
      }
      
      // 计算今日注册
      if (group.todayCount) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        returnObj.todayCount = results.filter(r => {
          const date = new Date(r.createdAt);
          return !isNaN(date.getTime()) && date >= today;
        }).length;
      }
      
      return [returnObj];
    }
  } catch (error) {
    console.error('安全聚合查询出错:', error);
    return [];
  }
};

module.exports = mongoose.model('Registration', RegistrationSchema); 