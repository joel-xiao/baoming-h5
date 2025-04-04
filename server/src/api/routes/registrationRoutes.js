const express = require('express');
const registrationController = require('../controllers/registrationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/registration
 * @desc    获取最近的报名记录
 * @access  Public
 */
router.get('/', registrationController.getRecentRegistrations);

/**
 * @route   POST /api/registration
 * @desc    创建新报名
 * @access  Public
 */
router.post('/', registrationController.createRegistration);

/**
 * @route   GET /api/registration/:id
 * @desc    获取单个报名详情
 * @access  Public
 */
router.get('/:id', registrationController.getRegistrationById);

/**
 * @route   PUT /api/registration/:id
 * @desc    更新报名信息
 * @access  Private
 */
router.put('/:id', authMiddleware, registrationController.updateRegistration);

/**
 * @route   DELETE /api/registration/:id
 * @desc    删除报名
 * @access  Private (Admin)
 */
router.delete('/:id', authMiddleware, registrationController.deleteRegistration);

/**
 * @route   GET /api/registration/team/:teamId
 * @desc    获取团队成员列表
 * @access  Public
 */
router.get('/team/:teamId', registrationController.getTeamMembers);

/**
 * @route   POST /api/registration/leader
 * @desc    创建队长预报名
 * @access  Public
 */
router.post('/leader', registrationController.createTeamLeader);

/**
 * @route   POST /api/registration/join
 * @desc    加入已有团队
 * @access  Public
 */
router.post('/join', registrationController.joinTeam);

/**
 * @route   PUT /api/registration/:id/payment-status
 * @desc    更新支付状态
 * @access  Private
 */
router.put('/:id/payment-status', authMiddleware, registrationController.updatePaymentStatus);

module.exports = router; 