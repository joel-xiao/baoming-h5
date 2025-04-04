const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const { ResponseUtil } = require('../../core/utils/ResponseUtil');

const router = express.Router();

// 所有管理员路由都需要身份验证和管理员权限
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/admin/registrations
 * @desc    获取所有报名记录（分页）
 * @access  Private (Admin)
 */
router.get('/registrations', adminController.getAllRegistrations);

/**
 * @route   GET /api/admin/stats
 * @desc    获取统计数据
 * @access  Private (Admin)
 */
router.get('/stats', adminController.getStats);

/**
 * @route   GET /api/admin/export/registrations
 * @desc    导出报名数据
 * @access  Private (Admin)
 */
router.get('/export/registrations', adminController.exportRegistrations);

/**
 * @route   GET /api/admin/export/payments
 * @desc    导出支付数据
 * @access  Private (Admin)
 */
router.get('/export/payments', adminController.exportPayments);

/**
 * @route   POST /api/admin/import/registrations
 * @desc    导入报名数据
 * @access  Private (Admin)
 */
router.post('/import/registrations', (req, res) => {
  ResponseUtil.error(res, '此功能尚未实现', 501);
});

/**
 * @route   GET /api/admin/users
 * @desc    获取所有管理员用户
 * @access  Private (Admin)
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   POST /api/admin/users
 * @desc    创建管理员
 * @access  Private (Admin)
 */
router.post('/users', adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    更新管理员信息
 * @access  Private (Admin)
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    删除管理员
 * @access  Private (Admin)
 */
router.delete('/users/:id', adminController.deleteUser);

module.exports = router; 