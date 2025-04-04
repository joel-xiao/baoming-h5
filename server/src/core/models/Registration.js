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

const PAYMENT_STATUS = {
  UNPAID: 'unpaid',      // 未支付
  PAID: 'paid',          // 已支付
  REFUNDED: 'refunded'   // 已退款
};

const GENDER = {
  MALE: 'male',          // 男
  FEMALE: 'female'       // 女
};

// 导出状态常量以便其他文件使用
module.exports.REGISTRATION_STATUS = REGISTRATION_STATUS;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
module.exports.GENDER = GENDER;

/**
 * 报名表字段定义
 */
const registrationFields = {
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
  age: {
    type: 'number',
    min: 0,
    max: 120
  },
  idCard: {
    type: 'string',
    length: 18,
    unique: true
  },
  phone: {
    type: 'string',
    required: true,
    length: 20
  },
  email: {
    type: 'string',
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },
  address: {
    type: 'string',
    length: 200
  },
  
  // 赛事信息
  eventId: {
    type: 'objectId',
    required: true
  },
  categoryId: {
    type: 'objectId',
    required: true
  },
  teamId: {
    type: 'objectId'
  },
  
  // 支付状态
  paymentStatus: {
    type: 'string',
    enum: [PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED],
    default: PAYMENT_STATUS.UNPAID
  },
  
  // 审核状态
  status: {
    type: 'string',
    enum: [REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.REJECTED],
    default: REGISTRATION_STATUS.PENDING
  },
  
  // 审核备注
  remarks: {
    type: 'string',
    length: 500
  },
  
  // 紧急联系人
  emergencyContact: {
    type: 'string',
    length: 50
  },
  emergencyPhone: {
    type: 'string',
    length: 20
  }
};

/**
 * 钩子函数 - 适用于所有数据库类型
 */
const hooks = {
  // 保存前验证身份证号格式
  validate: function(next) {
    // 当在Mongoose环境中使用
    const idCard = this.idCard || this.get?.('idCard');
    const phone = this.phone || this.get?.('phone');
    
    // 简单验证中国身份证号
    if (idCard && !/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(idCard)) {
      const error = new Error('身份证号格式不正确');
      return next ? next(error) : Promise.reject(error);
    }
    
    // 简单验证手机号
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      const error = new Error('手机号格式不正确');
      return next ? next(error) : Promise.reject(error);
    }
    
    return next ? next() : Promise.resolve();
  }
};

/**
 * 实例方法
 */
const methods = {
  // 获取参赛者完整信息
  getFullInfo: async function() {
    const obj = this.toObject ? this.toObject() : this;
    return {
      ...obj,
      // 可以在这里添加其他关联信息
      created: new Date(this.createdAt || obj.createdAt).toLocaleString()
    };
  }
};

/**
 * 静态方法
 */
const statics = {
  // 查找未支付的报名
  findUnpaid: async function() {
    return this.find({ paymentStatus: PAYMENT_STATUS.UNPAID });
  },
  
  // 通过审核
  approveRegistration: async function(id) {
    return this.findByIdAndUpdate ? 
      this.findByIdAndUpdate(id, { status: REGISTRATION_STATUS.APPROVED }, { new: true }) :
      this.update({ id }, { status: REGISTRATION_STATUS.APPROVED });
  },
  
  // 拒绝审核
  rejectRegistration: async function(id, remarks) {
    const updateData = { 
      status: REGISTRATION_STATUS.REJECTED,
      remarks: remarks || '报名信息不符合要求'
    };
    
    return this.findByIdAndUpdate ? 
      this.findByIdAndUpdate(id, updateData, { new: true }) :
      this.update({ id }, updateData);
  }
};

// 创建模型
const Registration = SchemaBuilder.createModel('Registration', registrationFields, {
  methods,
  statics,
  hooks: {
    validate: hooks.validate
  },
  collection: 'registrations'
});

module.exports.default = Registration; 