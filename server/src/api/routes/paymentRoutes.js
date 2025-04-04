const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/payment/create
 * @desc    创建支付订单
 * @access  Public
 */
router.post('/create', paymentController.createPaymentOrder);

/**
 * @route   GET /api/payment/status/:id
 * @desc    查询支付状态
 * @access  Public
 */
router.get('/status/:id', paymentController.getPaymentStatus);

/**
 * @route   POST /api/payment/notify/wechat
 * @desc    微信支付回调接口
 * @access  Public
 */
router.post('/notify/wechat', paymentController.wechatPayNotify);

/**
 * @route   POST /api/payment/notify/alipay
 * @desc    支付宝支付回调接口
 * @access  Public
 */
router.post('/notify/alipay', paymentController.alipayNotify);

/**
 * @route   PUT /api/payment/:id/status
 * @desc    手动更新支付状态
 * @access  Private (Admin)
 */
router.put('/:id/status', authMiddleware, paymentController.updatePaymentStatus);

/**
 * @route   GET /api/payment/registration/:registrationId
 * @desc    获取报名记录的所有支付记录
 * @access  Private
 */
router.get('/registration/:registrationId', authMiddleware, paymentController.getPaymentsByRegistration);

/**
 * @route   GET /api/payment/admin/orders
 * @desc    管理员获取所有支付订单
 * @access  Private (Admin)
 */
router.get('/admin/orders', authMiddleware, paymentController.getAllPaymentOrders);

/**
 * @route   POST /api/payment/refund/:id
 * @desc    退款
 * @access  Private (Admin)
 */
router.post('/refund/:id', authMiddleware, paymentController.refundPayment);

/**
 * @route   GET /api/payment/statistics
 * @desc    获取支付统计数据
 * @access  Private (Admin)
 */
router.get('/statistics', authMiddleware, paymentController.getPaymentStatistics);

module.exports = router; 