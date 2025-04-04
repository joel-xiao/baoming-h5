/**
 * 时间相关路由
 */
const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');

// 获取服务器时间
router.get('/server-time', timeController.getServerTime);

module.exports = router; 