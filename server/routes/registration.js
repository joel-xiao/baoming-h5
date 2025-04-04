const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');

// 获取报名记录
router.get('/', registrationController.getRegistrations);

// 创建队长报名
router.post('/leader', registrationController.createTeamLeader);

// 加入团队
router.post('/join', registrationController.joinTeam);

// 获取团队成员
router.get('/team/:teamId', registrationController.getTeamMembers);

module.exports = router; 