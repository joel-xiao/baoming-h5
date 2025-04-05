/**
 * 账户领域路由
 * 整合账户相关功能和子领域
 */

const express = require('express');
const router = express.Router();
// 使用子域的控制器代替主领域控制器
const authController = require('./subdomains/auth/controllers/authController');
const adminController = require('./subdomains/admin/controllers/adminController');
const { authMiddleware, adminMiddleware } = require('@middleware/authMiddleware');

// 认证路由
const authRouter = express.Router();

/**
 * @route   POST /api/account/login
 * @desc    管理员登录
 * @access  Public
 */
authRouter.post('/account/login', authController.login);

/**
 * @route   POST /api/account/refresh
 * @desc    刷新令牌
 * @access  Public
 */
authRouter.post('/account/refresh', authController.refreshToken);

/**
 * @route   POST /api/account/logout
 * @desc    退出登录
 * @access  Private
 */
authRouter.post('/account/logout', authMiddleware, authController.logout);

/**
 * @route   GET /api/account/me
 * @desc    获取当前用户信息
 * @access  Private
 */
authRouter.get('/account/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   PUT /api/account/password
 * @desc    修改密码
 * @access  Private
 */
authRouter.put('/account/password', authMiddleware, authController.changePassword);

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
adminRouter.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/admin/registrations
 * @desc    获取所有报名记录（分页）
 * @access  Private (Admin)
 */
adminRouter.get('/admin/registrations', adminController.getAllRegistrations);

/**
 * @route   GET /api/admin/stats
 * @desc    获取统计数据
 * @access  Private (Admin)
 */
adminRouter.get('/admin/stats', adminController.getStats);

/**
 * @route   GET /api/admin/export/registrations
 * @desc    导出报名数据
 * @access  Private (Admin)
 */
adminRouter.get('/admin/export/registrations', adminController.exportRegistrations);

/**
 * @route   GET /api/admin/export/payments
 * @desc    导出支付数据
 * @access  Private (Admin)
 */
adminRouter.get('/admin/export/payments', adminController.exportPayments);

/**
 * @route   GET /api/admin/users
 * @desc    获取所有管理员用户
 * @access  Private (Admin)
 */
adminRouter.get('/admin/users', adminController.getAllUsers);

/**
 * @route   POST /api/admin/users
 * @desc    创建管理员
 * @access  Private (Admin)
 */
adminRouter.post('/admin/users', adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    更新管理员信息
 * @access  Private (Admin)
 */
adminRouter.put('/admin/users/:id', adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    删除管理员
 * @access  Private (Admin)
 */
adminRouter.delete('/admin/users/:id', adminController.deleteUser);

module.exports = {
  authRoutes: authRouter,
  adminRoutes: adminRouter
};
