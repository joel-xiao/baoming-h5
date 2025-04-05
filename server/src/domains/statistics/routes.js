const express = require('express');
const statsController = require('./controllers/statsController');

const router = express.Router();

/**
 * @route   POST /api/statistics/record-view
 * @desc    记录页面浏览量
 * @access  Public
 */
router.post('/statistics/record-view', statsController.recordView);

/**
 * @route   GET /api/statistics/public
 * @desc    获取公开统计数据
 * @access  Public
 */
router.get('/statistics/public', statsController.getPublicStats);

module.exports = router;
