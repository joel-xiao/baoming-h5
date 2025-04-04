const bcrypt = require('bcrypt');
const { SchemaBuilder } = require('../utils/SchemaBuilder');

/**
 * 状态常量定义 - 用于替代直接使用中文
 */
const REGISTRATION_STATUS = {
  PENDING: 'pending',    // 待审核
  APPROVED: 'approved',  // 已通过
  REJECTED: 'rejected'   // 已拒绝
};

const GENDER = {
  MALE: 'male',          // 男
  FEMALE: 'female'       // 女
};

// 导出状态常量以便其他文件使用
module.exports.REGISTRATION_STATUS = REGISTRATION_STATUS;
module.exports.GENDER = GENDER;

/**
 * 简化后的报名表字段定义
 */
const registrationFields = {
  // 团队信息
  teamName: {
    type: 'string',
    required: true,
    length: 100
  },
  
  // 基本信息
  name: {
    type: 'string',
    required: true,
    length: 50
  },
  gender: {
    type: 'string',
    enum: [GENDER.MALE, GENDER.FEMALE],
    required: true
  },
  phone: {
    type: 'string',
    required: true,
    length: 20
  },
  idCard: {
    type: 'string',
    length: 18
  },
  openid: {
    type: 'string',
    length: 50
  },
  email: {
    type: 'string',
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },
  
  // 领队信息
  leader: {
    type: 'object'
  },
  
  // 成员列表
  members: {
    type: 'array',
    default: []
  },
  
  // 邀请码
  inviteCode: {
    type: 'string',
    length: 10
  },
  
  // 订单号
  orderNo: {
    type: 'string',
    length: 30,
    unique: true
  },
  
  // 审核状态
  status: {
    type: 'string',
    enum: [REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.REJECTED],
    default: REGISTRATION_STATUS.PENDING
  }
};

/**
 * 钩子函数 - 适用于所有数据库类型
 */
const hooks = {
  // 保存前验证手机号格式
  validate: function(next) {
    // 当在Mongoose环境中使用
    const phone = this.phone || this.get?.('phone');
    
    // 简单验证手机号
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      const error = new Error('手机号格式不正确');
      return next ? next(error) : Promise.reject(error);
    }
    
    return next ? next() : Promise.resolve();
  }
};

/**
 * 静态方法
 */
const statics = {
  // 通过审核
  approveRegistration: async function(id) {
    return this.findByIdAndUpdate ? 
      this.findByIdAndUpdate(id, { status: REGISTRATION_STATUS.APPROVED }, { new: true }) :
      this.update({ id }, { status: REGISTRATION_STATUS.APPROVED });
  },
  
  // 拒绝审核
  rejectRegistration: async function(id, remarks) {
    const updateData = { 
      status: REGISTRATION_STATUS.REJECTED
    };
    
    return this.findByIdAndUpdate ? 
      this.findByIdAndUpdate(id, updateData, { new: true }) :
      this.update({ id }, updateData);
  }
};

// 创建模型
const Registration = SchemaBuilder.createModel('Registration', registrationFields, {
  statics,
  hooks: {
    validate: hooks.validate
  },
  collection: 'registrations'
});

module.exports.default = Registration; 