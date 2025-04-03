const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');

console.log('>> 注册路由已加载 <<');

// 增加路由调试中间件
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] 收到注册路由请求: ${req.method} ${req.path}`);
  next();
});

// 获取报名记录
router.get('/', registrationController.getRegistrations);

// 创建队长报名
router.post('/leader', (req, res, next) => {
  console.log('收到创建队长请求，请求体:', req.body);
  registrationController.createTeamLeader(req, res, next);
});

// 加入团队
router.post('/join', registrationController.joinTeam);

// 获取团队成员
router.get('/team/:teamId', registrationController.getTeamMembers);

module.exports = router; 