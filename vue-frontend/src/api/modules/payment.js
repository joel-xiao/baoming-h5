/**
 * 支付相关API
 */
import apiInstance from '../core/axios';

/**
 * 创建支付订单
 * @param {Object} data - 支付数据
 * @param {string} data.registrationId - 报名ID
 * @param {string} data.paymentMethod - 支付方式 (weixin/alipay)
 * @returns {Promise<Object>} 支付订单信息
 * @access public - 公开接口，不需要鉴权
 */
export const createPayment = async (data) => {
  return await apiInstance.post('/payment/create', data);
};

/**
 * 查询支付状态
 * @param {string} orderId - 订单ID
 * @returns {Promise<Object>} 支付状态信息
 * @access public - 公开接口，不需要鉴权
 */
export const queryPaymentStatus = async (orderId) => {
  return await apiInstance.get(`/payment/status/${orderId}`);
};

/**
 * 获取支付历史记录
 * @param {string} registrationId - 报名ID
 * @returns {Promise<Object>} 支付历史记录
 * @access public - 公开接口，不需要鉴权
 */
export const getPaymentHistory = async (registrationId) => {
  return await apiInstance.get(`/payment/history/${registrationId}`);
};

/**
 * 关闭支付订单
 * @param {string} id - 支付订单ID
 * @returns {Promise<Object>} 关闭结果
 * @access public - 公开接口，不需要鉴权
 */
export const closePayment = async (id) => {
  try {
    return await apiInstance.post(`/payment/${id}/status`, {
      status: 'canceled'
    });
  } catch (error) {
    return error;
  }
};

/**
 * 申请退款
 * @param {Object} data - 退款数据
 * @param {string} data.id - 支付订单ID
 * @param {number} data.amount - 退款金额 (可选，默认全额退款)
 * @param {string} data.reason - 退款原因 (可选)
 * @returns {Promise<Object>} 退款申请结果
 * @access private - 需要管理员权限
 */
export const refundPayment = async (data) => {
  try {
    return await apiInstance.post(`/payment/refund/${data.id}`, {
      amount: data.amount,
      reason: data.reason
    });
  } catch (error) {
    return error;
  }
};

/**
 * 获取报名记录的所有支付记录
 * @param {string} registrationId - 报名记录ID
 * @returns {Promise<Object>} 支付记录列表
 * @access private - 需要管理员权限
 */
export const getRegistrationPayments = async (registrationId) => {
  try {
    return await apiInstance.get(`/payment/registration/${registrationId}`);
  } catch (error) {
    return error;
  }
};

// 导出所有API
export default {
  createPayment,
  queryPaymentStatus,
  getPaymentHistory,
  closePayment,
  refundPayment,
  getRegistrationPayments
}; 