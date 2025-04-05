const express = require('express');
const registrationController = require('./controllers/registrationController');
const teamController = require('./subdomains/team/controllers/teamController');
const individualController = require('./subdomains/individual/controllers/individualController');
const { authMiddleware } = require('@middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/registration
 * @desc    获取最近的报名记录
 * @access  Public
 */
router.get('/registration', registrationController.getRecentRegistrations);

/**
 * @route   POST /api/registration
 * @desc    创建新报名
 * @access  Public
 */
router.post('/registration', registrationController.createRegistration);

/**
 * @route   GET /api/registration/:id
 * @desc    获取单个报名详情
 * @access  Public
 */
router.get('/registration/:id', registrationController.getRegistrationById);

/**
 * @route   PUT /api/registration/:id
 * @desc    更新报名信息
 * @access  Private
 */
router.put('/registration/:id', authMiddleware, registrationController.updateRegistration);

/**
 * @route   DELETE /api/registration/:id
 * @desc    删除报名
 * @access  Private (Admin)
 */
router.delete('/registration/:id', authMiddleware, registrationController.deleteRegistration);

/**
 * @route   GET /api/registration/team/:teamId/members
 * @desc    获取团队成员列表
 * @access  Public
 */
router.get('/registration/team/:teamId/members', teamController.getTeamMembers);

/**
 * @route   POST /api/registration/team/leader
 * @desc    创建队长预报名
 * @access  Public
 */
router.post('/registration/team/leader', teamController.createTeamLeader);

/**
 * @route   POST /api/registration/team/join
 * @desc    加入已有团队
 * @access  Public
 */
router.post('/registration/team/join', teamController.joinTeam);

/**
 * @route   POST /api/registration/individual
 * @desc    创建个人报名
 * @access  Public
 */
router.post('/registration/individual', individualController.createIndividualRegistration);

/**
 * @route   GET /api/registration/individual/:id
 * @desc    获取个人报名详情
 * @access  Public
 */
router.get('/registration/individual/:id', individualController.getIndividualRegistration);

/**
 * @route   PUT /api/registration/individual/:id
 * @desc    更新个人报名信息
 * @access  Public
 */
router.put('/registration/individual/:id', individualController.updateIndividualRegistration);

/**
 * @route   GET /api/registration/individual
 * @desc    获取个人报名列表
 * @access  Private (Admin)
 */
router.get('/registration/individual', authMiddleware, individualController.getIndividualRegistrations);

/**
 * @route   GET /api/registration/individual/phone/:phone
 * @desc    根据手机号查询个人报名
 * @access  Public
 */
router.get('/registration/individual/phone/:phone', individualController.getIndividualByPhone);

/**
 * @route   PUT /api/registration/:id/payment-status
 * @desc    更新支付状态
 * @access  Private
 */
router.put('/registration/:id/payment-status', authMiddleware, registrationController.updatePaymentStatus);

// 保留旧的路由路径以确保向后兼容
router.post('/registration/leader', teamController.createTeamLeader);
router.post('/registration/join', teamController.joinTeam);
router.get('/registration/team/:teamId', teamController.getTeamMembers);

module.exports = router;
