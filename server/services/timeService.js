/**
 * 时间服务模块
 * 处理所有与时间相关的服务功能
 */

/**
 * 获取当前服务器时间
 * @returns {Object} 服务器时间信息
 */
exports.getCurrentTime = () => {
  return {
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  };
};

/**
 * 计算两个日期之间的时间差
 * @param {Date|string|number} startDate - 开始日期
 * @param {Date|string|number} endDate - 结束日期
 * @returns {Object} 包含天、小时、分钟、秒的时间差对象
 */
exports.getTimeDifference = (startDate, endDate) => {
  // 确保转换为日期对象
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 计算时间差（毫秒）
  const timeDiff = Math.max(0, end.getTime() - start.getTime());
  
  // 计算天、小时、分钟、秒
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds: timeDiff
  };
};

/**
 * 检查活动是否已结束
 * @param {Date|string|number} endTime - 活动结束时间
 * @returns {boolean} 是否已结束
 */
exports.isActivityEnded = (endTime) => {
  const endDate = new Date(endTime);
  const now = new Date();
  return now > endDate;
}; 