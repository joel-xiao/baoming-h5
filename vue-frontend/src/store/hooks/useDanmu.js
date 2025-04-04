import { computed } from 'vue'
import { useStore } from 'vuex'

/**
 * 弹幕相关的状态和方法
 * @returns {Object} - 弹幕相关状态和方法
 */
export function useDanmu() {
  const store = useStore()
  
  // 弹幕状态
  const isDanmuEnabled = computed(() => store.getters['danmu/isDanmuEnabled'])
  const danmuFrequency = computed(() => store.getters['danmu/danmuFrequency'])
  const danmuConfig = computed(() => store.getters['danmu/danmuConfig'])
  const specialDanmuList = computed(() => store.getters['danmu/specialDanmuList'])
  
  /**
   * 更新弹幕配置
   * @param {Object} config - 弹幕配置
   */
  const updateDanmuConfig = (config) => {
    store.dispatch('danmu/updateDanmuConfig', config)
  }
  
  /**
   * 触发普通弹幕
   * @param {Object} danmuData - 弹幕数据
   * @param {string} danmuData.text - 弹幕文本
   * @param {string} danmuData.userName - 用户名
   */
  const triggerDanmu = (danmuData) => {
    store.dispatch('danmu/triggerDanmu', danmuData)
  }
  
  /**
   * 触发特殊弹幕
   * @param {Object} danmuData - 弹幕数据
   * @param {string} danmuData.type - 弹幕类型
   * @param {string} danmuData.text - 弹幕文本
   * @param {string} danmuData.userName - 用户名
   */
  const triggerSpecialDanmu = (danmuData) => {
    store.dispatch('danmu/triggerSpecialDanmu', danmuData)
  }
  
  /**
   * 移除弹幕
   * @param {number} index - 弹幕索引
   */
  const removeDanmu = (index) => {
    store.dispatch('danmu/removeDanmu', index)
  }
  
  return {
    // 状态
    isDanmuEnabled,
    danmuFrequency,
    danmuConfig,
    specialDanmuList,
    
    // 方法
    updateDanmuConfig,
    triggerDanmu,
    triggerSpecialDanmu,
    removeDanmu
  }
} 