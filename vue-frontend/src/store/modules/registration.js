import { registrationApi, paymentApi } from '../../api'
import { apiCache } from '../../api'

/**
 * 注册状态管理模块
 */
const state = {
  // 特意保留空
}

const getters = {
  // 特意保留空
}

const mutations = {
  // 特意保留空
}

const actions = {
  /**
   * 加载参与者数据
   */
  async loadParticipants({ commit, rootState }) {
    try {
      // 使用带缓存的API以提高性能
      const result = await registrationApi.getCachedRegistrations()
      
      if (result.success && Array.isArray(result.data)) {
        // 将数据转换成参与者格式
        const participants = result.data.map(item => ({
          name: (item.leader && item.leader.name) || item.name || '匿名',
          avatar: (item.leader && item.leader.name) ? item.leader.name.substr(0, 1) : (item.name ? item.name.substr(0, 1) : '?')
        }))
        
        commit('activity/SET_PARTICIPANTS', participants, { root: true })
      } else {
        // API获取失败时，设置空数组
        console.error('从API获取参与者数据失败:', result.message)
        commit('activity/SET_PARTICIPANTS', [], { root: true })
        // 添加错误状态处理
        commit('system/SET_ERROR', { show: true, message: '获取参与者数据失败' }, { root: true })
      }
      
      return result
    } catch (error) {
      console.error('加载参与者列表失败:', error)
      commit('activity/SET_PARTICIPANTS', [], { root: true })
      commit('system/SET_ERROR', { show: true, message: '获取参与者数据出错' }, { root: true })
      return { success: false, message: error.message }
    }
  },
  
  /**
   * 加载订单数据
   */
  async loadOrders({ commit, rootState }) {
    try {
      // 从API获取订单数据
      const result = await registrationApi.getRegistrations()
      
      if (result.success && Array.isArray(result.data)) {
        // 只获取支付成功的订单
        const successOrders = result.data.filter(order => order.paymentStatus === 'success')
        
        // 格式化订单数据
        const formattedOrders = successOrders.map(order => {
          // 手机号脱敏
          const maskPhone = phone => {
            if (!phone || phone.length !== 11) return phone
            return phone.substring(0, 3) + '****' + phone.substring(7)
          }
          
          // 格式化日期
          const formatDate = dateString => {
            if (!dateString) return ''
            const date = new Date(dateString)
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          }
          
          return {
            // 正确获取嵌套在leader对象中的name字段，或使用备用方案
            name: (order.leader && order.leader.name) || order.name || '匿名',
            phone: maskPhone((order.leader && order.leader.phone) || order.phone || ''),
            amount: order.paymentAmount || rootState.activity.config.price,
            status: '已支付',
            time: formatDate(order.paymentTime || order.createdAt)
          }
        })
        
        commit('activity/SET_ORDERS', formattedOrders, { root: true })
        return { success: true, data: formattedOrders }
      } else {
        // API获取失败时，设置空数组
        console.error('从API获取订单数据失败:', result.message)
        commit('activity/SET_ORDERS', [], { root: true })
        commit('system/SET_ERROR', { show: true, message: '获取订单数据失败' }, { root: true })
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error('加载订单列表失败:', error)
      commit('activity/SET_ORDERS', [], { root: true })
      commit('system/SET_ERROR', { show: true, message: '获取订单数据出错' }, { root: true })
      return { success: false, message: error.message }
    }
  },
  
  /**
   * 提交注册信息
   */
  async submitRegistration({ commit, rootState }) {
    try {
      // 准备用户数据，确保统一处理openid
      const userData = {
        name: rootState.user.name,
        phone: rootState.user.phone,
        openid: rootState.user.openid || 'wx_' + Date.now() // 在实际项目中应该从微信获取
      }
      
      // 根据用户类型选择不同的API
      const registerResult = rootState.user.userType === 'team_leader'
        ? await registrationApi.createTeamLeader(userData)
        : await registrationApi.joinTeam({
            ...userData,
            inviteCode: rootState.user.teamCode
          })
      
      if (!registerResult.success) {
        return registerResult // 直接返回错误信息
      }
      
      // 创建支付订单
      const paymentResult = await paymentApi.createPayment({
        registrationId: registerResult.data.id,
        openid: userData.openid,
        name: userData.name,
        phone: userData.phone,
        isTeamLeader: rootState.user.userType === 'team_leader',
        amount: rootState.activity.config.price
      })
      
      if (!paymentResult.success) {
        return {
          success: false,
          message: paymentResult.message || '创建支付订单失败'
        }
      }
      
      // 保存订单信息
      commit('payment/SET_PAYMENT_INFO', {
        orderNo: paymentResult.data.orderNo,
        amount: rootState.activity.config.price,
        status: 'pending'
      }, { root: true })
      
      // 清除API缓存，确保下次获取到最新数据
      apiCache.clearCache('getRegistrations')
      
      // 添加弹幕
      commit('danmu/ADD_SPECIAL_DANMU', {
        type: 'normal',
        text: `${userData.name}成功报名啦！`,
        userName: userData.name,
        time: new Date().getTime()
      }, { root: true })
      
      // 返回支付结果
      return {
        success: true,
        paymentParams: paymentResult.data.paymentParams,
        orderNo: paymentResult.data.orderNo
      }
    } catch (error) {
      console.error('提交报名信息失败:', error)
      commit('system/SET_ERROR', { 
        show: true, 
        message: error.message || '提交失败，请稍后重试' 
      }, { root: true })
      return {
        success: false,
        message: error.message || '提交失败，请稍后重试'
      }
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 