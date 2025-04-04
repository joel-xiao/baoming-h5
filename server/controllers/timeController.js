/**
 * 时间控制器
 * 处理所有与时间相关的HTTP请求
 */
const timeService = require('../services/timeService');

/**
 * 获取服务器时间
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
exports.getServerTime = async (req, res) => {
  try {
    // 调用时间服务获取当前时间
    const serverTime = timeService.getCurrentTime();
    
    return res.status(200).json({
      success: true,
      data: serverTime
    });
  } catch (error) {
    console.error('获取服务器时间错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取服务器时间失败',
      error: error.message 
    });
  }
};

/**
 * 计算活动剩余时间
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
exports.getActivityRemainingTime = async (req, res) => {
  try {
    // 从请求中获取结束时间，如果没有提供则使用默认值
    const { endTime } = req.query;
    const defaultEndTime = '2025-04-30T12:00:00+08:00'; // 默认活动结束时间
    
    // 获取当前服务器时间
    const now = Date.now();
    
    // 计算剩余时间
    const remaining = timeService.getTimeDifference(
      now, 
      endTime || defaultEndTime
    );
    
    // 检查活动是否已结束
    const isEnded = timeService.isActivityEnded(endTime || defaultEndTime);
    
    return res.status(200).json({
      success: true,
      data: {
        remaining,
        isEnded,
        serverTime: timeService.getCurrentTime()
      }
    });
  } catch (error) {
    console.error('获取活动剩余时间错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取活动剩余时间失败',
      error: error.message 
    });
  }
}; 