const teamService = require('../services/TeamService');
const logger = require('../../../../../infrastructure/utils/helper/Logger');

/**
 * 创建团队领队
 * @route POST /api/registration/team/leader
 * @access 公开
 */
const createTeamLeader = async (req, res) => {
  try {
    const result = await teamService.createTeamLeader(req.body);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(result.status || 201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error(`创建团队领队错误: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: '创建团队领队时发生错误'
    });
  }
};

/**
 * 加入团队
 * @route POST /api/registration/team/join
 * @access 公开
 */
const joinTeam = async (req, res) => {
  try {
    const result = await teamService.joinTeam(req.body);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error(`加入团队错误: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: '加入团队时发生错误'
    });
  }
};

/**
 * 获取团队成员
 * @route GET /api/registration/team/:teamId/members
 * @access 公开
 */
const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const result = await teamService.getTeamMembers(teamId);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error(`获取团队成员错误: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: '获取团队成员时发生错误'
    });
  }
};

module.exports = {
  createTeamLeader,
  joinTeam,
  getTeamMembers
}; 