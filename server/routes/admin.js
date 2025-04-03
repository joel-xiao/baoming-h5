const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 获取所有报名记录
router.get('/registrations', adminController.getAllRegistrations);

// 获取报名统计
router.get('/stats', adminController.getRegistrationStats);

// 记录浏览量 - 新增
router.post('/record-view', adminController.recordView);

// 导出报名数据
router.get('/export', adminController.exportRegistrations);

module.exports = router; 