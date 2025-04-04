/**
 * 系统状态管理模块
 */
const state = {
  // 系统错误状态
  error: {
    show: false,
    message: ''
  }
}

const getters = {
  hasError: state => state.error.show,
  errorMessage: state => state.error.message
}

const mutations = {
  SET_ERROR(state, { show, message }) {
    state.error = { show, message }
  }
}

const actions = {
  /**
   * 设置系统错误
   * @param {Object} error - 错误信息对象
   * @param {boolean} error.show - 是否显示错误
   * @param {string} error.message - 错误信息
   */
  setError({ commit }, { show, message }) {
    commit('SET_ERROR', { show, message })
    
    // 5秒后自动清除错误
    if (show) {
      setTimeout(() => {
        commit('SET_ERROR', { show: false, message: '' })
      }, 5000)
    }
  },
  
  /**
   * 清除错误
   */
  clearError({ commit }) {
    commit('SET_ERROR', { show: false, message: '' })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 