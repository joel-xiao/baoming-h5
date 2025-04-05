/**
 * 统计数据相关控制器
 */
const logger = require('../../../infrastructure/utils/helper/Logger');
const ModelFactory = require('../../../infrastructure/database/connectors/ModelFactory');
const Stats = require('../models/Stats');
const { ResponseUtil } = require('../../../infrastructure/utils/helper/ResponseUtil');

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
    
    return ResponseUtil.success(res, '浏览量记录成功');
  } catch (error) {
    logger.error(`记录浏览量错误: ${error.message}`);
    return ResponseUtil.serverError(res, '记录浏览量失败', error);
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
    return ResponseUtil.success(res, '获取统计数据成功', {
      viewsCount: totalViews,
      todayViewsCount: todayViews
    });
  } catch (error) {
    logger.error(`获取公开统计数据错误: ${error.message}`);
    return ResponseUtil.serverError(res, '获取统计数据失败', error);
  }
};

module.exports = {
  recordView,
  getPublicStats
}; 