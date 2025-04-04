const bcrypt = require('bcrypt');
const { SchemaBuilder } = require('../utils/SchemaBuilder');

/**
 * 状态常量定义 - 用于替代直接使用中文
 */
const REGISTRATION_STATUS = {
  ACTIVE: 'active',     // 有效状态
  INACTIVE: 'inactive'  // 无效状态
};

const GENDER = {
  MALE: 'male',          // 男
  FEMALE: 'female'       // 女
};

const PAYMENT_STATUS = {
  UNPAID: 'unpaid',         // 未支付
  PARTIALLY_PAID: 'partially_paid', // 部分支付
  PAID: 'paid'              // 已支付
};

// 导出状态常量以便其他文件使用
module.exports.REGISTRATION_STATUS = REGISTRATION_STATUS;
module.exports.GENDER = GENDER;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;

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
  
  // 状态
  status: {
    type: 'string',
    enum: [REGISTRATION_STATUS.ACTIVE, REGISTRATION_STATUS.INACTIVE],
    default: REGISTRATION_STATUS.ACTIVE
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
  // 设置为无效状态
  deactivateRegistration: async function(id, remarks) {
    const updateData = { 
      status: REGISTRATION_STATUS.INACTIVE,
      remarks: remarks
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