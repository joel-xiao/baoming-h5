/**
 * 支付相关API
 */
import apiInstance from '../core/axios';
import { handleApiError } from '../core/errorHandler';

/**
 * 创建支付订单
 * @param {Object} data - 支付订单数据
 * @param {string} data.openid - 微信openid
 * @param {string} data.name - 姓名
 * @param {string} data.phone - 电话
 * @param {boolean} data.isTeamLeader - 是否是队长
 * @param {number} data.amount - 支付金额
 * @returns {Promise<Object>} 支付订单创建结果
 */
export const createPayment = async (data) => {
  try {
    return await apiInstance.post('/payment/create', data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 查询支付状态
 * @param {string} orderNo - 订单编号
 * @returns {Promise<Object>} 支付状态
 */
export const getPaymentStatus = async (orderNo) => {
  try {
    return await apiInstance.get(`/payment/status/${orderNo}`);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 关闭支付订单
 * @param {string} orderNo - 订单编号
 * @returns {Promise<Object>} 关闭结果
 */
export const closePayment = async (orderNo) => {
  try {
    return await apiInstance.post(`/payment/close/${orderNo}`);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 申请退款
 * @param {Object} data - 退款数据
 * @param {string} data.orderNo - 订单编号
 * @param {number} data.amount - 退款金额
 * @param {string} data.reason - 退款原因
 * @returns {Promise<Object>} 退款申请结果
 */
export const refundPayment = async (data) => {
  try {
    return await apiInstance.post('/payment/refund', data);
  } catch (error) {
    return handleApiError(error);
  }
};

// 导出所有API
export default {
  createPayment,
  getPaymentStatus,
  closePayment,
  refundPayment
}; 