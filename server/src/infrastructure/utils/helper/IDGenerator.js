/**
 * ID生成器工具类
 * 提供各种ID、编号生成方法
 */

/**
 * 生成唯一的订单号/编号
 * @param {string} prefix - 前缀，如 'T'=团队, 'R'=注册, 'P'=支付等
 * @param {number} randomLength - 随机数长度，默认为3
 * @returns {string} 生成的唯一编号
 */
const generateUniqueId = (prefix = '', randomLength = 3) => {
  // 使用时间戳确保唯一性
  const timestamp = Date.now();
  // 生成指定长度的随机数字，并填充前导零
  const randomNum = Math.floor(Math.random() * Math.pow(10, randomLength))
    .toString()
    .padStart(randomLength, '0');
  
  // 组合成最终的ID
  return `${prefix}${timestamp}${randomNum}`;
};

/**
 * 生成团队订单号
 * @returns {string} 团队订单号，以T开头
 */
const generateTeamOrderId = () => {
  return generateUniqueId('T');
};

/**
 * 生成注册订单号
 * @returns {string} 注册订单号，以R开头
 */
const generateRegistrationOrderId = () => {
  return generateUniqueId('R');
};

/**
 * 生成支付订单号
 * @returns {string} 支付订单号，以P开头
 */
const generatePaymentOrderId = () => {
  return generateUniqueId('P');
};

/**
 * 生成邀请码
 * @param {number} length - 邀请码长度，默认为6
 * @returns {string} 大写字母和数字组成的邀请码
 */
const generateInviteCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
};

module.exports = {
  generateUniqueId,
  generateTeamOrderId,
  generateRegistrationOrderId,
  generatePaymentOrderId,
  generateInviteCode
}; 