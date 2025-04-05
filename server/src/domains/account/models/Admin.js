const container = require('@common/di/Container');

// 通过容器获取 SchemaMapper
const SchemaMapper = container.resolve('schemaMapper');

/**
 * 管理员角色常量
 */
const ADMIN_ROLE = {
  ADMIN: 'admin',
  EDITOR: 'editor'
};

/**
 * 管理员状态常量
 */
const ADMIN_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

/**
 * 管理员字段定义
 */
const adminSchema = {
  // 用户名
  username: {
    type: 'string',
    required: true,
    unique: true,
    length: 50
  },
  
  // 密码
  password: {
    type: 'string',
    required: true
  },
  
  // 姓名
  name: {
    type: 'string',
    required: true,
    length: 50
  },
  
  // 角色
  role: {
    type: 'string',
    enum: Object.values(ADMIN_ROLE),
    default: ADMIN_ROLE.EDITOR
  },
  
  // 状态
  status: {
    type: 'string',
    enum: Object.values(ADMIN_STATUS),
    default: ADMIN_STATUS.ACTIVE
  },
  
  // 联系方式
  email: {
    type: 'string',
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },
  
  phone: {
    type: 'string',
    length: 20
  },
  
  // 登录信息
  lastLoginAt: {
    type: 'date'
  },
  
  // 密码重置字段
  passwordResetToken: {
    type: 'string'
  },
  
  passwordResetExpires: {
    type: 'date'
  }
};

/**
 * 模型配置
 */
const modelConfig = {
  timestamps: true,
  collection: 'admins'
};

// 创建管理员模型
const Admin = SchemaMapper.createModel('Admin', adminSchema, modelConfig);

// 导出模型和常量
module.exports = Admin;
module.exports.ADMIN_ROLE = ADMIN_ROLE;
module.exports.ADMIN_STATUS = ADMIN_STATUS; 