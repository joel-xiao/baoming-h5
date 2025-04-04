import { computed } from 'vue'
import { useStore } from 'vuex'

/**
 * 用户相关的状态和方法
 * @returns {Object} - 用户相关状态和方法
 */
export function useUser() {
  const store = useStore()
  
  // 用户状态
  const userInfo = computed(() => store.getters['user/userInfo'])
  const isTeamLeader = computed(() => store.getters['user/isTeamLeader'])
  const isFormValid = computed(() => store.getters['user/isFormValid'])
  
  /**
   * 更新用户信息
   * @param {Object} userData - 用户数据
   */
  const updateUserInfo = (userData) => {
    store.dispatch('user/updateUserInfo', userData)
  }
  
  /**
   * 设置用户类型
   * @param {string} type - 用户类型，'team_leader'或'team_member'
   */
  const setUserType = (type) => {
    store.dispatch('user/setUserType', type)
  }
  
  /**
   * 设置团队码
   * @param {string} code - 团队码
   */
  const setTeamCode = (code) => {
    store.dispatch('user/setTeamCode', code)
  }
  
  /**
   * 更新表单状态
   * @param {Object} formState - 表单状态
   */
  const updateFormState = (formState) => {
    store.dispatch('user/updateFormState', formState)
  }
  
  /**
   * 设置表单验证器
   * @param {Function} validator - 表单验证函数
   */
  const setFormValidator = (validator) => {
    store.dispatch('user/setFormValidator', validator)
  }
  
  /**
   * 处理表单提交
   */
  const submitHandler = () => {
    store.dispatch('user/submitHandler')
  }
  
  return {
    // 状态
    userInfo,
    isTeamLeader,
    isFormValid,
    
    // 方法
    updateUserInfo,
    setUserType,
    setTeamCode,
    updateFormState,
    setFormValidator,
    submitHandler
  }
} 