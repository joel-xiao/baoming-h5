import { useStore } from 'vuex'

/**
 * 注册相关的方法
 * @returns {Object} - 注册相关方法
 */
export function useRegistration() {
  const store = useStore()
  
  /**
   * 加载参与者数据
   */
  const loadParticipants = async () => {
    return await store.dispatch('registration/loadParticipants')
  }
  
  /**
   * 加载订单数据
   */
  const loadOrders = async () => {
    return await store.dispatch('registration/loadOrders')
  }
  
  /**
   * 提交注册信息
   */
  const submitRegistration = async () => {
    return await store.dispatch('registration/submitRegistration')
  }
  
  return {
    // 方法
    loadParticipants,
    loadOrders,
    submitRegistration
  }
} 