const express = require('express');
const registrationRoutes = require('./registrationRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 服务器时间
router.get('/time', (req, res) => {
  res.json({ serverTime: new Date() });
});

// 各模块路由
router.use('/auth', authRoutes);
router.use('/registration', registrationRoutes);
router.use('/payment', paymentRoutes);
router.use('/admin', adminRoutes);

module.exports = router; 