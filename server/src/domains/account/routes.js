/**
 * 账户领域路由
 * 简化版账户相关功能
 */

const express = require('express');
const router = express.Router();
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');

// 定义公共路径 - 不需要身份验证的API
const publicPaths = [
  { path: '/api/account/login', method: 'POST' },
  { path: '/api/account/password/reset', method: 'POST' },
  { path: '/api/account/password/reset/:token', method: 'PUT' }
];

// 认证路由
const authRouter = express.Router();

/**
 * @route   POST /api/account/login
 * @desc    管理员登录
 * @access  Public
 */
authRouter.post('/account/login', authController.login);

/**
 * @route   POST /api/account/logout
 * @desc    管理员登出
 * @access  Private
 */
authRouter.post('/account/logout', authController.logout);

/**
 * @route   GET /api/account/me
 * @desc    获取当前用户信息
 * @access  Private
 */
authRouter.get('/account/me', authController.getCurrentUser);

/**
 * @route   PUT /api/account/password
 * @desc    修改密码
 * @access  Private
 */
authRouter.put('/account/password', authController.changePassword);

/**
 * @route   POST /api/account/password/reset
 * @desc    发送密码重置邮件
 * @access  Public
 */
authRouter.post('/account/password/reset', authController.sendPasswordResetEmail);

/**
 * @route   PUT /api/account/password/reset/:token
 * @desc    使用令牌重置密码
 * @access  Public
 */
authRouter.put('/account/password/reset/:token', authController.resetPassword);

// 管理员路由
// 所有管理员路由都需要身份验证和管理员权限
const adminRouter = express.Router();

/**
 * @route   GET /api/account/admin/list
 * @desc    获取所有管理员列表
 * @access  Private (Admin)
 */
adminRouter.get('/account/admin/list', adminController.getAllAdmins);

/**
 * @route   POST /api/account/admin/create
 * @desc    创建新管理员
 * @access  Private (Admin)
 */
adminRouter.post('/account/admin/create', adminController.createAdmin);

/**
 * @route   PUT /api/account/admin/:id/status
 * @desc    更新管理员状态
 * @access  Private (Admin)
 */
adminRouter.put('/account/admin/:id/status', adminController.updateAdminStatus);

/**
 * @route   DELETE /api/account/admin/:id
 * @desc    删除管理员
 * @access  Private (Admin)
 */
adminRouter.delete('/account/admin/:id', adminController.deleteAdmin);

module.exports = {
  authRoutes: authRouter,
  adminRoutes: adminRouter,
  publicPaths
};
