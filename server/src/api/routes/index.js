const express = require('express');
const registrationRoutes = require('./registrationRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const statsRoutes = require('./statsRoutes');
const { ResponseUtil } = require('../../core/utils/ResponseUtil');

const router = express.Router();

// 健康检查
router.get('/health', (req, res) => {
  ResponseUtil.success(res, 'API服务正常', { status: 'ok', timestamp: new Date() });
});

// 服务器时间API，符合前端期望格式
router.get('/time/server-time', (req, res) => {
  const now = new Date();
  ResponseUtil.success(res, '获取服务器时间成功', { 
    timestamp: now.getTime(),
    serverTime: now.toISOString()
  });
});

// 各模块路由
router.use('/auth', authRoutes);
router.use('/registration', registrationRoutes);
router.use('/payment', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);

module.exports = router; 