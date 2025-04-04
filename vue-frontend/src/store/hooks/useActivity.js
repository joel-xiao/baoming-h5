import { computed } from 'vue'
import { useStore } from 'vuex'

/**
 * 活动相关的状态和方法
 * @returns {Object} - 活动相关状态和方法
 */
export function useActivity() {
  const store = useStore()
  
  // 活动状态
  const activityEnded = computed(() => store.getters['activity/isActivityEnded'])
  const price = computed(() => store.getters['activity/currentPrice'])
  const endTime = computed(() => store.getters['activity/activityEndTime'])
  const participants = computed(() => store.getters['activity/participantsList'])
  const orders = computed(() => store.getters['activity/ordersList'])
  const stats = computed(() => store.getters['activity/activityStats'])
  
  /**
   * 加载活动统计数据
   */
  const loadStats = async () => {
    return await store.dispatch('activity/loadActivityStats')
  }
  
  /**
   * 检查活动是否已结束
   */
  const checkActivityEnd = () => {
    return store.dispatch('activity/checkActivityEnd')
  }
  
  return {
    // 状态
    activityEnded,
    price,
    endTime,
    participants,
    orders,
    stats,
    
    // 方法
    loadStats,
    checkActivityEnd
  }
} 