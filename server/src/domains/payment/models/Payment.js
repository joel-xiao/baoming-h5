const { SchemaBuilder } = require('../../../infrastructure/utils/helper/SchemaBuilder');

/**
 * 支付方式常量
 */
const PAYMENT_METHOD = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  BANK_TRANSFER: 'bank_transfer',
  ONSITE: 'onsite',
  TEST: 'test',
  OTHER: 'other'
};

/**
 * 支付状态常量
 */
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  CANCELED: 'canceled',
  PAID: 'paid',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CLOSED: 'closed',
  FAILED: 'failed'
};

/**
 * 支付记录字段定义
 */
const paymentFields = {
  // 关联的报名表ID
  registrationId: {
    type: 'objectId',
    required: true
  },
  
  // 支付金额
  amount: {
    type: 'number',
    required: true,
    min: 0,
    decimal: true,
    precision: 10,
    scale: 2
  },
  
  // 支付方式
  paymentMethod: {
    type: 'string',
    enum: [PAYMENT_METHOD.WECHAT, PAYMENT_METHOD.ALIPAY, PAYMENT_METHOD.BANK_TRANSFER, PAYMENT_METHOD.ONSITE, PAYMENT_METHOD.TEST, PAYMENT_METHOD.OTHER],
    required: false
  },
  
  // 支付状态
  status: {
    type: 'string',
    enum: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.COMPLETED, PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.CANCELED, PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_REFUNDED, PAYMENT_STATUS.CLOSED, PAYMENT_STATUS.FAILED],
    default: PAYMENT_STATUS.PENDING
  },
  
  // 交易号
  transactionId: {
    type: 'string',
    sparse: true,
    unique: true,
    required: true
  },
  
  // 支付时间
  paidAt: {
    type: 'date'
  },
  
  // 退款时间
  refundedAt: {
    type: 'date'
  },
  
  // 支付凭证（例如转账截图等）
  paymentProof: {
    type: 'string'
  },
  
  // 备注
  remarks: {
    type: 'string',
    length: 500
  }
};

/**
 * 钩子函数 - 适用于所有数据库类型
 */
const hooks = {
  // 保存前处理
  save: function(next) {
    // 获取数据 - 兼容Mongoose和Sequelize
    const status = this.status || this.get?.('status');
    let paidAt = this.paidAt || this.get?.('paidAt');
    let refundedAt = this.refundedAt || this.get?.('refundedAt');
    
    // 如果状态是已完成但没有支付时间，则设置支付时间
    if (status === PAYMENT_STATUS.COMPLETED && !paidAt) {
      paidAt = new Date();
      
      // 根据环境更新属性
      if (typeof this.set === 'function') {
        this.set('paidAt', paidAt);
      } else {
        this.paidAt = paidAt;
      }
    }
    
    // 如果状态是已退款但没有退款时间，则设置退款时间
    if (status === PAYMENT_STATUS.REFUNDED && !refundedAt) {
      refundedAt = new Date();
      
      // 根据环境更新属性
      if (typeof this.set === 'function') {
        this.set('refundedAt', refundedAt);
      } else {
        this.refundedAt = refundedAt;
      }
    }
    
    // 支持回调和Promise风格
    return next ? next() : Promise.resolve();
  }
};

/**
 * 实例方法
 */
const methods = {
  // 格式化金额显示
  getFormattedAmount: function() {
    const amount = this.amount || this.get?.('amount') || 0;
    return `¥${Number(amount).toFixed(2)}`;
  },
  
  // 获取支付状态的中文描述
  getStatusDescription: function() {
    const status = this.status || this.get?.('status') || '';
    
    const statusMap = {
      [PAYMENT_STATUS.PENDING]: '等待支付',
      [PAYMENT_STATUS.PROCESSING]: '正在处理中',
      [PAYMENT_STATUS.COMPLETED]: '支付已完成',
      [PAYMENT_STATUS.REFUNDED]: '已退款',
      [PAYMENT_STATUS.CANCELED]: '支付已取消',
      [PAYMENT_STATUS.PAID]: '已支付',
      [PAYMENT_STATUS.PARTIALLY_REFUNDED]: '部分退款',
      [PAYMENT_STATUS.CLOSED]: '已关闭',
      [PAYMENT_STATUS.FAILED]: '支付失败'
    };
    
    return statusMap[status] || status;
  },
  
  // 获取支付方式的中文描述
  getPaymentMethodDescription: function() {
    const method = this.paymentMethod || this.get?.('paymentMethod') || '';
    
    const methodMap = {
      [PAYMENT_METHOD.WECHAT]: '微信支付',
      [PAYMENT_METHOD.ALIPAY]: '支付宝',
      [PAYMENT_METHOD.BANK_TRANSFER]: '银行转账',
      [PAYMENT_METHOD.ONSITE]: '现场支付',
      [PAYMENT_METHOD.TEST]: '测试支付',
      [PAYMENT_METHOD.OTHER]: '其他方式'
    };
    
    return methodMap[method] || method;
  }
};

/**
 * 静态方法
 */
const statics = {
  // 查找指定报名表的所有支付记录
  findByRegistration: async function(registrationId) {
    return this.find?.({ registrationId }) || [];
  },
  
  // 完成支付
  completePayment: async function(id, transactionId) {
    const updateData = {
      status: PAYMENT_STATUS.COMPLETED,
      transactionId,
      paidAt: new Date()
    };
    
    return this.findByIdAndUpdate ? 
      this.findByIdAndUpdate(id, updateData, { new: true }) :
      this.update({ id }, updateData);
  },
  
  // 退款
  refundPayment: async function(id, remarks) {
    const updateData = {
      status: PAYMENT_STATUS.REFUNDED,
      refundedAt: new Date(),
      remarks: remarks || '退款处理'
    };
    
    return this.findByIdAndUpdate ? 
      this.findByIdAndUpdate(id, updateData, { new: true }) :
      this.update({ id }, updateData);
  }
};

// 创建支付模型
const Payment = SchemaBuilder.createModel('Payment', paymentFields, {
  methods,
  statics,
  hooks: {
    save: hooks.save
  },
  collection: 'payments'
});

// 导出模型和常量
module.exports.default = Payment;
module.exports.PAYMENT_METHOD = PAYMENT_METHOD;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS; 