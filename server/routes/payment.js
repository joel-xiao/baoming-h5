const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 创建支付订单
router.post('/create', paymentController.createPayment);

// 支付回调
router.post('/notify', paymentController.paymentNotify);

// 查询支付状态
router.get('/status/:orderNo', paymentController.queryPaymentStatus);

// 管理员接口：获取所有支付订单
router.get('/admin/orders', paymentController.getAllPayments);

module.exports = router; 