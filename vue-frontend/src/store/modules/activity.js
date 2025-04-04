import { adminApi } from '../../api'

/**
 * 活动状态管理模块
 */
const state = {
  config: {
    // 活动结束时间（中国时间，格式：YYYY-MM-DDTHH:mm:ss+08:00）
    endTime: '2025-04-30T12:00:00+08:00',
    
    // 默认统计数据
    defaultStats: {
      participants: 96,
      views: 2716
    },
    
    // 价格配置（单位：元）
    price: 99
  },
  participants: [],
  orders: [],
  activityEnded: false,
  stats: null
}

const getters = {
  isActivityEnded: state => state.activityEnded,
  currentPrice: state => state.config.price,
  activityEndTime: state => state.config.endTime,
  participantsList: state => state.participants,
  ordersList: state => state.orders,
  activityStats: state => state.stats
}

const mutations = {
  SET_PARTICIPANTS(state, participants) {
    state.participants = participants
  },
  SET_ORDERS(state, orders) {
    state.orders = orders
  },
  SET_ACTIVITY_ENDED_STATUS(state, status) {
    state.activityEnded = status
  },
  SET_ACTIVITY_STATS(state, stats) {
    state.stats = stats
  }
}

const actions = {
  /**
   * 加载活动统计数据并记录浏览量
   */
  async loadActivityStats({ commit }) {
    try {
      // 同时记录浏览量
      try {
        await adminApi.recordView()
      } catch (viewError) {
        console.error('记录浏览量失败:', viewError)
        // 继续加载统计数据，不影响主流程
      }
      
      // 获取活动统计数据
      const result = await adminApi.getStats()
      
      if (result?.success && result.data) {
        // 确保viewsCount为数字
        let viewsCount = 0
        if (typeof result.data.viewsCount === 'number') {
          viewsCount = result.data.viewsCount
        } else if (result.data.viewsCount !== undefined) {
          viewsCount = Number(result.data.viewsCount) || 0
        }
        
        // 提交到store
        const statsData = {
          totalCount: result.data.totalCount || 0,
          teamLeaderCount: result.data.teamLeaderCount || 0,
          teamMemberCount: result.data.teamMemberCount || 0,
          totalAmount: result.data.totalAmount || 0,
          todayCount: result.data.todayCount || 0,
          viewsCount: viewsCount
        }
        
        commit('SET_ACTIVITY_STATS', statsData)
        return statsData
      } else {
        console.error('获取统计数据失败或格式错误:', result)
        commit('SET_ACTIVITY_STATS', getDefaultStats())
        return null
      }
    } catch (error) {
      console.error('加载活动统计数据失败:', error)
      commit('SET_ACTIVITY_STATS', getDefaultStats())
      return null
    }
  },
  
  /**
   * 检查活动是否已结束
   */
  checkActivityEnd({ commit, state }) {
    const endTimeStr = state.config.endTime
    const endTime = new Date(endTimeStr)
    const now = new Date()
    const isEnded = now > endTime
    
    commit('SET_ACTIVITY_ENDED_STATUS', isEnded)
    return isEnded
  }
}

/**
 * 获取默认统计数据
 * @returns {Object} 默认统计数据
 */
function getDefaultStats() {
  return {
    totalCount: 0,
    teamLeaderCount: 0,
    teamMemberCount: 0,
    totalAmount: 0,
    todayCount: 0,
    viewsCount: 0
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 