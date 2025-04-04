/**
 * 弹幕状态管理模块
 */
const state = {
  // 弹幕配置
  config: {
    enabled: true,
    frequency: 1000 // 每1秒发送一条弹幕
  },
  // 特殊弹幕队列
  specialDanmu: []
}

const getters = {
  isDanmuEnabled: state => state.config.enabled,
  danmuFrequency: state => state.config.frequency,
  danmuConfig: state => state.config,
  specialDanmuList: state => state.specialDanmu
}

const mutations = {
  UPDATE_DANMU_CONFIG(state, danmuConfig) {
    state.config = { ...state.config, ...danmuConfig }
  },
  ADD_SPECIAL_DANMU(state, danmuData) {
    state.specialDanmu.push(danmuData)
  },
  REMOVE_SPECIAL_DANMU(state, index) {
    state.specialDanmu.splice(index, 1)
  }
}

const actions = {
  /**
   * 更新弹幕配置
   */
  updateDanmuConfig({ commit }, config) {
    commit('UPDATE_DANMU_CONFIG', config)
  },
  
  /**
   * 触发普通弹幕
   */
  triggerDanmu({ commit }, { text, userName }) {
    commit('ADD_SPECIAL_DANMU', {
      type: 'normal',
      text,
      userName,
      time: new Date().getTime()
    })
  },
  
  /**
   * 触发特殊弹幕
   */
  triggerSpecialDanmu({ commit }, { type, text, userName }) {
    commit('ADD_SPECIAL_DANMU', {
      type: type || 'normal',
      text,
      userName,
      time: new Date().getTime()
    })
  },
  
  /**
   * 移除弹幕
   */
  removeDanmu({ commit }, index) {
    commit('REMOVE_SPECIAL_DANMU', index)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 