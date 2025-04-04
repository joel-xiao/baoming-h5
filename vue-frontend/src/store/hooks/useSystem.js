import { computed } from 'vue'
import { useStore } from 'vuex'

/**
 * 系统相关的状态和方法
 * @returns {Object} - 系统相关状态和方法
 */
export function useSystem() {
  const store = useStore()
  
  // 错误状态
  const hasError = computed(() => store.getters['system/hasError'])
  const errorMessage = computed(() => store.getters['system/errorMessage'])
  
  /**
   * 设置系统错误
   * @param {Object} error - 错误信息对象
   * @param {boolean} error.show - 是否显示错误
   * @param {string} error.message - 错误信息
   */
  const setError = (error) => {
    store.dispatch('system/setError', error)
  }
  
  /**
   * 清除错误
   */
  const clearError = () => {
    store.dispatch('system/clearError')
  }
  
  return {
    // 状态
    hasError,
    errorMessage,
    
    // 方法
    setError,
    clearError
  }
} 