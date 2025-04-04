const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    管理员登录
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新令牌
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    退出登录
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 */
router.put('/password', authMiddleware, authController.changePassword);

/**
 * @route   POST /api/auth/password/reset
 * @desc    发送密码重置邮件
 * @access  Public
 */
router.post('/password/reset', authController.sendPasswordResetEmail);

/**
 * @route   PUT /api/auth/password/reset/:token
 * @desc    使用令牌重置密码
 * @access  Public
 */
router.put('/password/reset/:token', authController.resetPassword);

module.exports = router; 