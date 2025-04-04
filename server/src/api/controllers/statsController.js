/**
 * 统计数据相关控制器
 */
const logger = require('../../core/utils/Logger');
const ModelFactory = require('../../core/db/ModelFactory');
const Stats = require('../../core/models/Stats');

/**
 * 记录页面浏览量
 * @route POST /api/stats/record-view
 * @access 公开
 */
const recordView = async (req, res) => {
  try {
    // 获取客户端IP和User-Agent
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'];
    
    // 获取Stats模型
    const statsModel = ModelFactory.getModel(Stats);
    
    // 记录浏览量
    await statsModel.recordView({
      ip,
      userAgent,
      referer
    });
    
    res.status(200).json({
      success: true,
      message: '浏览量记录成功'
    });
  } catch (error) {
    logger.error(`记录浏览量错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '记录浏览量失败'
    });
  }
};

/**
 * 获取公开统计数据
 * @route GET /api/stats/public
 * @access 公开
 */
const getPublicStats = async (req, res) => {
  try {
    // 获取模型
    const statsModel = ModelFactory.getModel(Stats);
    
    // 获取浏览量统计
    const totalViews = await statsModel.getTotalViews();
    const todayViews = await statsModel.getTodayViews();
    
    // 返回统计数据 - 只包含浏览量
    res.status(200).json({
      success: true,
      message: '获取统计数据成功',
      data: {
        viewsCount: totalViews,
        todayViewsCount: todayViews
      }
    });
  } catch (error) {
    logger.error(`获取公开统计数据错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
};

module.exports = {
  recordView,
  getPublicStats
}; 