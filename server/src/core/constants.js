/**
 * 系统常量定义
 * 避免在代码中直接使用中文字符串，防止编码问题
 */

// 管理员角色
const ADMIN_ROLE = {
  SUPER_ADMIN: 'super_admin',    // 超级管理员
  ADMIN: 'admin',                // 管理员
  REVIEWER: 'reviewer',          // 审核员
  DATA_ENTRY: 'data_entry'       // 数据录入员
};

// 管理员状态
const ADMIN_STATUS = {
  ACTIVE: 'active',              // 激活
  DISABLED: 'disabled'           // 禁用
};

// 报名状态
const REGISTRATION_STATUS = {
  PENDING: 'pending',            // 待审核
  APPROVED: 'approved',          // 已通过
  REJECTED: 'rejected',          // 已拒绝
  PRE_REGISTER: 'pre_register'   // 预注册
};

// 支付状态
const PAYMENT_STATUS = {
  UNPAID: 'unpaid',              // 未支付
  PAID: 'paid',                  // 已支付
  REFUNDED: 'refunded',          // 已退款
  PARTIAL_REFUND: 'partial_refund' // 部分退款
};

// 支付方式
const PAYMENT_METHOD = {
  WECHAT: 'wechat',              // 微信支付
  ALIPAY: 'alipay',              // 支付宝
  BANK_TRANSFER: 'bank',         // 银行转账
  ONSITE: 'onsite'               // 现场支付
};

// 支付状态
const PAYMENT_PROCESS_STATUS = {
  PENDING: 'pending',            // 待支付
  PROCESSING: 'processing',      // 处理中
  COMPLETED: 'completed',        // 已完成
  REFUNDED: 'refunded',          // 已退款
  CANCELED: 'canceled',          // 已取消
  CLOSED: 'closed'               // 已关闭
};

// 性别
const GENDER = {
  MALE: 'male',                  // 男
  FEMALE: 'female'               // 女
};

// 中文状态描述映射
const STATUS_DESCRIPTION = {
  // 报名状态描述
  [REGISTRATION_STATUS.PENDING]: '待审核',
  [REGISTRATION_STATUS.APPROVED]: '已通过',
  [REGISTRATION_STATUS.REJECTED]: '已拒绝',
  [REGISTRATION_STATUS.PRE_REGISTER]: '预注册',
  
  // 支付状态描述
  [PAYMENT_STATUS.UNPAID]: '未支付',
  [PAYMENT_STATUS.PAID]: '已支付',
  [PAYMENT_STATUS.REFUNDED]: '已退款',
  [PAYMENT_STATUS.PARTIAL_REFUND]: '部分退款',
  
  // 支付处理状态描述
  [PAYMENT_PROCESS_STATUS.PENDING]: '待支付',
  [PAYMENT_PROCESS_STATUS.PROCESSING]: '处理中',
  [PAYMENT_PROCESS_STATUS.COMPLETED]: '已完成',
  [PAYMENT_PROCESS_STATUS.REFUNDED]: '已退款',
  [PAYMENT_PROCESS_STATUS.CANCELED]: '已取消',
  [PAYMENT_PROCESS_STATUS.CLOSED]: '已关闭',
  
  // 管理员角色描述
  [ADMIN_ROLE.SUPER_ADMIN]: '超级管理员',
  [ADMIN_ROLE.ADMIN]: '管理员',
  [ADMIN_ROLE.REVIEWER]: '审核员',
  [ADMIN_ROLE.DATA_ENTRY]: '数据录入员',
  
  // 管理员状态描述
  [ADMIN_STATUS.ACTIVE]: '激活',
  [ADMIN_STATUS.DISABLED]: '禁用',
  
  // 支付方式描述
  [PAYMENT_METHOD.WECHAT]: '微信支付',
  [PAYMENT_METHOD.ALIPAY]: '支付宝',
  [PAYMENT_METHOD.BANK_TRANSFER]: '银行转账',
  [PAYMENT_METHOD.ONSITE]: '现场支付',
  
  // 性别描述
  [GENDER.MALE]: '男',
  [GENDER.FEMALE]: '女'
};

// 导出所有常量
module.exports = {
  ADMIN_ROLE,
  ADMIN_STATUS,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PAYMENT_PROCESS_STATUS,
  GENDER,
  STATUS_DESCRIPTION,
  
  // 工具函数：获取状态的中文描述
  getStatusDescription: (status) => STATUS_DESCRIPTION[status] || status
}; 