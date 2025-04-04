import { computed } from 'vue'
import { useStore } from 'vuex'

/**
 * 支付相关的状态和方法
 * @returns {Object} - 支付相关状态和方法
 */
export function usePayment() {
  const store = useStore()
  
  // 支付状态
  const paymentInfo = computed(() => store.getters['payment/paymentInfo'])
  const paymentStatus = computed(() => store.getters['payment/paymentStatus'])
  const isPending = computed(() => store.getters['payment/isPending'])
  const isSuccess = computed(() => store.getters['payment/isSuccess'])
  const isFailed = computed(() => store.getters['payment/isFailed'])
  
  /**
   * 检查支付状态
   * @param {string} orderNo - 订单号
   */
  const checkPaymentStatus = async (orderNo) => {
    return await store.dispatch('payment/checkPaymentStatus', orderNo)
  }
  
  /**
   * 更新支付信息
   * @param {Object} paymentInfo - 支付信息
   */
  const updatePaymentInfo = (paymentInfo) => {
    store.dispatch('payment/updatePaymentInfo', paymentInfo)
  }
  
  /**
   * 设置支付处理函数
   * @param {Function} handler - 支付处理函数
   */
  const setSubmitHandler = (handler) => {
    store.dispatch('payment/setSubmitHandler', handler)
  }
  
  return {
    // 状态
    paymentInfo,
    paymentStatus,
    isPending,
    isSuccess,
    isFailed,
    
    // 方法
    checkPaymentStatus,
    updatePaymentInfo,
    setSubmitHandler
  }
} 