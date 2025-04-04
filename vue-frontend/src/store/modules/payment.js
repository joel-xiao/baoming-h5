import { paymentApi } from '../../api'

/**
 * 支付状态管理模块
 */
const state = {
  orderNo: '',
  amount: 0,
  status: '',  // pending, success, failed
  errorMessage: '',
  // 支付处理函数
  submitHandler: null
}

const getters = {
  paymentStatus: state => state.status,
  paymentInfo: state => ({
    orderNo: state.orderNo,
    amount: state.amount,
    status: state.status,
    errorMessage: state.errorMessage
  }),
  isPending: state => state.status === 'pending',
  isSuccess: state => state.status === 'success',
  isFailed: state => state.status === 'failed'
}

const mutations = {
  SET_PAYMENT_INFO(state, { orderNo, amount, status, errorMessage }) {
    if (orderNo !== undefined) state.orderNo = orderNo
    if (amount !== undefined) state.amount = amount
    if (status !== undefined) state.status = status
    if (errorMessage !== undefined) state.errorMessage = errorMessage
  },
  SET_SUBMIT_HANDLER(state, handler) {
    state.submitHandler = handler
  }
}

const actions = {
  /**
   * 检查支付状态
   * @param {string} orderNo - 订单号
   */
  async checkPaymentStatus({ commit }, orderNo) {
    try {
      const result = await paymentApi.getPaymentStatus(orderNo)
      
      if (result.success) {
        commit('SET_PAYMENT_INFO', {
          orderNo,
          status: result.data.paymentStatus,
          errorMessage: ''
        })
        
        return {
          success: true,
          status: result.data.paymentStatus
        }
      } else {
        throw new Error(result.message || '获取支付状态失败')
      }
    } catch (error) {
      console.error('检查支付状态失败:', error)
      commit('SET_PAYMENT_INFO', {
        status: 'failed',
        errorMessage: error.message
      })
      
      return {
        success: false,
        status: 'failed',
        error: error.message
      }
    }
  },
  
  /**
   * 更新支付信息
   */
  updatePaymentInfo({ commit }, paymentInfo) {
    commit('SET_PAYMENT_INFO', paymentInfo)
  },
  
  /**
   * 设置支付处理函数
   */
  setSubmitHandler({ commit }, handler) {
    commit('SET_SUBMIT_HANDLER', handler)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 