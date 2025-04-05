const express = require('express');
const paymentController = require('./controllers/paymentController');
const wechatPaymentController = require('./subdomains/wechat/controllers/wechatPaymentController');
const alipayController = require('./subdomains/alipay/controllers/alipayController');
const { authMiddleware, adminMiddleware } = require('@middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/payment/create
 * @desc    创建支付订单
 * @access  Public
 */
router.post('/payment/create', paymentController.createPaymentOrder);

/**
 * @route   GET /api/payment/status/:id
 * @desc    查询支付状态
 * @access  Public
 */
router.get('/payment/status/:id', paymentController.getPaymentStatus);

/**
 * @route   POST /api/payment/notify/wechat
 * @desc    微信支付回调接口
 * @access  Public
 */
router.post('/payment/notify/wechat', paymentController.wechatPayNotify);

/**
 * @route   POST /api/payment/notify/alipay
 * @desc    支付宝支付回调接口
 * @access  Public
 */
router.post('/payment/notify/alipay', paymentController.alipayNotify);

/**
 * @route   PUT /api/payment/:id/status
 * @desc    手动更新支付状态
 * @access  Private (Admin)
 */
router.put('/payment/:id/status', authMiddleware, adminMiddleware, paymentController.updatePaymentStatus);

/**
 * @route   GET /api/payment/registration/:registrationId
 * @desc    获取报名记录的所有支付记录
 * @access  Private
 */
router.get('/payment/registration/:registrationId', authMiddleware, paymentController.getPaymentsByRegistration);

/**
 * @route   GET /api/payment/admin/orders
 * @desc    管理员获取所有支付订单
 * @access  Private (Admin)
 */
router.get('/payment/admin/orders', authMiddleware, adminMiddleware, paymentController.getAllPaymentOrders);

/**
 * @route   POST /api/payment/refund/:id
 * @desc    退款
 * @access  Private (Admin)
 */
router.post('/payment/refund/:id', authMiddleware, adminMiddleware, paymentController.refundPayment);

/**
 * @route   GET /api/payment/statistics
 * @desc    获取支付统计数据
 * @access  Private (Admin)
 */
router.get('/payment/statistics', authMiddleware, adminMiddleware, paymentController.getPaymentStatistics);

/**
 * @route   GET /api/payment/test-complete/:orderNumber
 * @desc    测试支付成功处理
 * @access  Public (仅开发环境)
 */
if (process.env.NODE_ENV !== 'production') {
  router.get('/payment/test-complete/:orderNumber', paymentController.completeTestPayment);
}

// 微信支付特定API
// ===============================

/**
 * @route   GET /api/payment/wechat/jsapi-params/:orderNumber
 * @desc    获取微信支付JSAPI支付参数
 * @access  Public
 */
router.get('/payment/wechat/jsapi-params/:orderNumber', wechatPaymentController.getJsapiParameters);

/**
 * @route   GET /api/payment/wechat/query/:orderNumber
 * @desc    查询微信支付订单状态
 * @access  Private
 */
router.get('/payment/wechat/query/:orderNumber', authMiddleware, wechatPaymentController.queryWechatOrder);

// 支付宝特定API
// ===============================

/**
 * @route   GET /api/payment/alipay/query/:orderNumber
 * @desc    查询支付宝订单状态
 * @access  Private
 */
router.get('/payment/alipay/query/:orderNumber', authMiddleware, alipayController.queryAlipayOrder);

module.exports = {
  router,
  initEventHandlers: paymentController.initEventHandlers
};
