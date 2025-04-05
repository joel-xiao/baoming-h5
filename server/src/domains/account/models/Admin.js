const bcrypt = require('bcrypt');
const { SchemaBuilder } = require('../../../infrastructure/utils/helper/SchemaBuilder');

/**
 * 管理员角色常量
 */
const ADMIN_ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  DATA_ENTRY: 'data_entry'
};

/**
 * 管理员状态常量
 */
const ADMIN_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled'
};

/**
 * 管理员字段定义
 */
const adminFields = {
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
  
  // 邮箱
  email: {
    type: 'string',
    required: true,
    unique: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },
  
  // 手机号
  phone: {
    type: 'string',
    length: 20
  },
  
  // 角色
  role: {
    type: 'string',
    enum: [ADMIN_ROLE.SUPER_ADMIN, ADMIN_ROLE.ADMIN, ADMIN_ROLE.REVIEWER, ADMIN_ROLE.DATA_ENTRY],
    default: ADMIN_ROLE.DATA_ENTRY
  },
  
  // 状态
  status: {
    type: 'string',
    enum: [ADMIN_STATUS.ACTIVE, ADMIN_STATUS.DISABLED],
    default: ADMIN_STATUS.ACTIVE
  },
  
  // 最后登录时间
  lastLoginAt: {
    type: 'date'
  },
  
  // 最后登录IP
  lastLoginIp: {
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
  // 保存前加密密码
  save: async function(next) {
    try {
      // 检查密码是否被修改
      const isModified = typeof this.isModified === 'function' 
        ? this.isModified('password')
        : typeof this.changed === 'function'
          ? this.changed('password')
          : true; // 默认假设已修改
      
      // 只有密码被修改时才重新加密
      if (!isModified) {
        return next ? next() : Promise.resolve();
      }
      
      // 获取密码 - 兼容不同的ORM
      const password = this.password || this.get?.('password');
      if (!password) {
        return next ? next() : Promise.resolve();
      }
      
      // 生成盐值并加密
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 设置加密后的密码
      if (typeof this.set === 'function') {
        this.set('password', hashedPassword);
      } else {
        this.password = hashedPassword;
      }
      
      return next ? next() : Promise.resolve();
    } catch (error) {
      return next ? next(error) : Promise.reject(error);
    }
  }
};

/**
 * 实例方法
 */
const methods = {
  // 比较密码
  comparePassword: async function(candidatePassword) {
    const password = this.password || this.get?.('password') || '';
    return bcrypt.compare(candidatePassword, password);
  },
  
  // 获取管理员基本信息（不含密码）
  getBasicInfo: function() {
    const obj = this.toObject ? this.toObject() : {...this};
    const { password, ...userInfo } = obj;
    return userInfo;
  },
  
  // 检查是否有指定权限
  hasPermission: function(permission) {
    const role = this.role || this.get?.('role') || '';
    
    // 超级管理员拥有所有权限
    if (role === ADMIN_ROLE.SUPER_ADMIN) return true;
    
    // 根据角色分配权限
    const rolePermissions = {
      [ADMIN_ROLE.ADMIN]: ['manage_events', 'manage_registrations', 'manage_payments', 'view_reports'],
      [ADMIN_ROLE.REVIEWER]: ['manage_registrations', 'view_reports'],
      [ADMIN_ROLE.DATA_ENTRY]: ['manage_registrations']
    };
    
    return rolePermissions[role]?.includes(permission) || false;
  },
  
  // 获取角色的中文描述
  getRoleDescription: function() {
    const role = this.role || this.get?.('role') || '';
    
    const roleMap = {
      [ADMIN_ROLE.SUPER_ADMIN]: '超级管理员',
      [ADMIN_ROLE.ADMIN]: '管理员',
      [ADMIN_ROLE.REVIEWER]: '审核员',
      [ADMIN_ROLE.DATA_ENTRY]: '数据录入员'
    };
    
    return roleMap[role] || role;
  },
  
  // 获取状态的中文描述
  getStatusDescription: function() {
    const status = this.status || this.get?.('status') || '';
    
    const statusMap = {
      [ADMIN_STATUS.ACTIVE]: '激活',
      [ADMIN_STATUS.DISABLED]: '禁用'
    };
    
    return statusMap[status] || status;
  }
};

/**
 * 静态方法
 */
const statics = {
  // 根据用户名查找管理员
  findByUsername: async function(username) {
    return this.findOne?.({ username }) || null;
  },
  
  // 根据邮箱查找管理员
  findByEmail: async function(email) {
    return this.findOne?.({ email }) || null;
  },
  
  // 查找所有激活状态的管理员
  findActiveAdmins: async function() {
    return this.find?.({ status: ADMIN_STATUS.ACTIVE }) || [];
  },
  
  // 记录登录信息
  recordLogin: async function(id, ip) {
    const updateData = {
      lastLoginAt: new Date(),
      lastLoginIp: ip
    };
    
    return this.findByIdAndUpdate 
      ? this.findByIdAndUpdate(id, updateData, { new: true })
      : this.update({ id }, updateData);
  }
};

// 创建管理员模型
const Admin = SchemaBuilder.createModel('Admin', adminFields, {
  methods,
  statics,
  hooks: {
    save: hooks.save
  },
  collection: 'admins'
});

// 导出常量和模型
module.exports.default = Admin;
module.exports.ADMIN_ROLE = ADMIN_ROLE;
module.exports.ADMIN_STATUS = ADMIN_STATUS; 