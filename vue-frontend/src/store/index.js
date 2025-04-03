import { createStore } from 'vuex'
import { registrationApi, paymentApi, adminApi } from '../api'

export default createStore({
  state: {
    activityConfig: {
      // 活动结束时间（中国时间，格式：YYYY-MM-DDTHH:mm:ss+08:00）
      endTime: '2025-04-30T12:00:00+08:00',
      
      // 默认统计数据
      defaultStats: {
        participants: 96,
        views: 2716
      },
      
      // 价格配置（单位：元）
      price: 99,
      
      // 弹幕配置
      danmu: {
        enabled: true,
        frequency: 1000 // 每1秒发送一条弹幕，原来是1500毫秒
      }
    },
    participants: [],
    orders: [],
    user: {
      name: '',
      phone: '',
      userType: 'team_leader', // team_leader或team_member
      teamCode: '',
      avatar: '',
      openid: ''
    },
    // 特殊弹幕队列
    specialDanmu: [],
    // 活动是否已结束
    activityEnded: false,
    // 系统错误状态
    systemError: {
      show: false,
      message: ''
    },
    // 表单状态
    formState: {
      isValid: false,
      userType: 'team_leader',
      teamCode: '',
      agreeTerms: false
    },
    // 表单验证函数
    formValidator: null,
    // 支付处理函数
    submitHandler: null,
    // 支付状态
    payment: {
      orderNo: '',
      amount: 0,
      status: '',  // pending, success, failed
      errorMessage: ''
    },
    activityStats: null
  },
  getters: {
    isActivityEnded(state) {
      return state.activityEnded;
    },
    hasSystemError(state) {
      return state.systemError.show;
    },
    isFormValid(state) {
      return state.formState.isValid;
    },
    paymentStatus(state) {
      return state.payment.status;
    }
  },
  mutations: {
    setUserInfo(state, { name, phone, avatar, openid }) {
      state.user.name = name;
      state.user.phone = phone;
      if (avatar !== undefined) state.user.avatar = avatar;
      if (openid !== undefined) state.user.openid = openid;
    },
    setUserType(state, type) {
      state.user.userType = type;
    },
    setTeamCode(state, code) {
      state.user.teamCode = code;
    },
    setParticipants(state, participants) {
      state.participants = participants;
    },
    setOrders(state, orders) {
      state.orders = orders;
    },
    updateDanmuConfig(state, danmuConfig) {
      console.log('更新弹幕配置:', state.activityConfig.danmu, '->', danmuConfig)
      state.activityConfig.danmu = danmuConfig;
      // 打印当前弹幕状态
      console.log('弹幕当前状态:', state.activityConfig.danmu.enabled ? '已启用' : '已禁用', 
                  '频率:', state.activityConfig.danmu.frequency);
    },
    addSpecialDanmu(state, danmuData) {
      state.specialDanmu.push(danmuData);
    },
    removeSpecialDanmu(state, index) {
      state.specialDanmu.splice(index, 1);
    },
    setActivityEndedStatus(state, status) {
      state.activityEnded = status;
      console.log('[Store] 设置活动结束状态:', status);
    },
    setSystemError(state, { show, message }) {
      state.systemError = { show, message };
    },
    setFormState(state, formState) {
      state.formState = {...state.formState, ...formState};
    },
    setFormValidator(state, validator) {
      state.formValidator = validator;
    },
    setSubmitHandler(state, handler) {
      state.submitHandler = handler;
    },
    setPaymentInfo(state, { orderNo, amount, status, errorMessage }) {
      if (orderNo !== undefined) state.payment.orderNo = orderNo;
      if (amount !== undefined) state.payment.amount = amount;
      if (status !== undefined) state.payment.status = status;
      if (errorMessage !== undefined) state.payment.errorMessage = errorMessage;
    },
    setActivityStats(state, stats) {
      state.activityStats = stats;
    }
  },
  actions: {
    async loadParticipants({ commit, state }) {
      try {
        console.log('开始加载参与者数据');
        // 从API获取报名人数据
        const result = await registrationApi.getRegistrations();
        
        if (result.success && Array.isArray(result.data)) {
          // 将数据转换成参与者格式
          const participants = result.data.map(item => ({
            name: item.name || '匿名',
            avatar: item.name ? item.name.substr(0, 1) : '?'
          }));
          
          console.log('获取到的参与者数据数量:', participants.length);
          commit('setParticipants', participants);
        } else {
          // API获取失败时，设置空数组
          console.error('从API获取参与者数据失败');
          commit('setParticipants', []);
        }
        
        console.log('参与者数据设置完成，当前store中数量:', state.participants.length);
      } catch (error) {
        console.error('加载参与者列表失败:', error);
        commit('setParticipants', []);
      }
    },
    async loadOrders({ commit, state }) {
      try {
        // 从API获取订单数据
        const result = await registrationApi.getRegistrations();
        
        if (result.success && Array.isArray(result.data)) {
          // 只获取支付成功的订单
          const successOrders = result.data.filter(order => order.paymentStatus === 'success');
          
          // 格式化订单数据
          const formattedOrders = successOrders.map(order => {
            // 手机号脱敏
            const maskPhone = phone => {
              if (!phone || phone.length !== 11) return phone;
              return phone.substring(0, 3) + '****' + phone.substring(7);
            };
            
            // 格式化日期
            const formatDate = dateString => {
              if (!dateString) return '';
              const date = new Date(dateString);
              return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            };
            
            return {
              name: order.name || '匿名',
              phone: maskPhone(order.phone || ''),
              amount: order.paymentAmount || state.activityConfig.price,
              status: '已支付',
              time: formatDate(order.paymentTime || order.createdAt)
            };
          });
          
          commit('setOrders', formattedOrders);
        } else {
          // API获取失败时，设置空数组
          console.error('从API获取订单数据失败');
          commit('setOrders', []);
        }
      } catch (error) {
        console.error('加载订单列表失败:', error);
        commit('setOrders', []);
      }
    },
    triggerDanmu({ commit, state }, { text, userName }) {
      commit('addSpecialDanmu', {
        type: 'normal',
        text,
        userName,
        time: new Date().getTime()
      });
    },
    triggerSpecialDanmu({ commit, state }, { type, text, userName }) {
      commit('addSpecialDanmu', {
        type: type || 'normal',
        text,
        userName,
        time: new Date().getTime()
      });
    },
    async submitRegistration({ commit, state }) {
      try {
        let result;
        
        // 根据用户类型选择不同的API
        if (state.user.userType === 'team_leader') {
          // 创建队长报名
          result = await registrationApi.createTeamLeader({
            name: state.user.name,
            phone: state.user.phone,
            openid: state.user.openid || 'wx_' + Date.now() // 在实际项目中应该从微信获取
          });
        } else {
          // 加入团队
          result = await registrationApi.joinTeam({
            name: state.user.name,
            phone: state.user.phone,
            openid: state.user.openid || 'wx_' + Date.now(), // 在实际项目中应该从微信获取
            teamId: state.user.teamCode
          });
        }
        
        if (result.success) {
          // 创建支付订单
          const paymentResult = await paymentApi.createPayment({
            openid: state.user.openid || 'wx_' + Date.now(),
            name: state.user.name,
            phone: state.user.phone,
            isTeamLeader: state.user.userType === 'team_leader',
            amount: state.activityConfig.price
          });
          
          if (paymentResult.success) {
            // 保存订单信息
            commit('setPaymentInfo', {
              orderNo: paymentResult.data.orderNo,
              amount: state.activityConfig.price,
              status: 'pending'
            });
            
            // 返回支付结果
            return {
              success: true,
              paymentParams: paymentResult.data.paymentParams,
              orderNo: paymentResult.data.orderNo
            };
          } else {
            throw new Error(paymentResult.message || '创建支付订单失败');
          }
        }
        
        return result;
      } catch (error) {
        console.error('提交报名信息失败:', error);
        return {
          success: false,
          message: error.message || '提交失败，请稍后重试'
        };
      }
    },
    async checkPaymentStatus({ commit, state }, orderNo) {
      try {
        const result = await paymentApi.getPaymentStatus(orderNo);
        
        if (result.success) {
          commit('setPaymentInfo', {
            orderNo,
            status: result.data.paymentStatus,
            errorMessage: ''
          });
          
          return {
            success: true,
            status: result.data.paymentStatus
          };
        } else {
          throw new Error(result.message || '获取支付状态失败');
        }
      } catch (error) {
        console.error('检查支付状态失败:', error);
        commit('setPaymentInfo', {
          status: 'failed',
          errorMessage: error.message
        });
        
        return {
          success: false,
          status: 'failed',
          error: error.message
        };
      }
    },
    setSystemError({ commit }, { type, message }) {
      commit('setSystemError', { show: true, message });
      // 5秒后自动清除错误
      setTimeout(() => {
        commit('setSystemError', { show: false, message: '' });
      }, 5000);
    },
    // 处理表单提交或显示
    submitHandler({ commit, state }) {
      const form = document.getElementById('registration-form')
      if (form) {
        form.style.display = 'block'
        form.scrollIntoView({ behavior: 'smooth' })
      }
    },
    async loadActivityStats({ commit }) {
      try {
        console.log('开始加载活动统计数据和记录浏览量...');
        
        // 同时记录浏览量
        let viewResponse;
        try {
          console.log('正在调用recordView API...');
          viewResponse = await adminApi.recordView();
          console.log('记录浏览量成功:', viewResponse);
        } catch (viewError) {
          console.error('记录浏览量失败:', viewError);
          // 继续加载统计数据，不影响主流程
        }
        
        // 获取活动统计数据
        console.log('正在调用getStats API...');
        const result = await adminApi.getStats();
        console.log('获取统计数据API响应:', result);
        
        if (result && result.success && result.data) {
          console.log('获取活动统计数据成功:', result.data);
          
          // 确保viewsCount存在且为数字
          if (typeof result.data.viewsCount !== 'number') {
            console.warn(`viewsCount不是数字类型: ${typeof result.data.viewsCount}, 值:`, result.data.viewsCount);
            // 尝试转换为数字
            if (result.data.viewsCount !== undefined && result.data.viewsCount !== null) {
              result.data.viewsCount = Number(result.data.viewsCount);
              if (isNaN(result.data.viewsCount)) {
                console.warn('viewsCount转换为数字失败，设置为0');
                result.data.viewsCount = 0;
              }
            } else {
              console.warn('viewsCount不存在，设置为0');
              result.data.viewsCount = 0;
            }
          }
          
          // 提交到store
          commit('setActivityStats', {
            totalCount: result.data.totalCount || 0,
            teamLeaderCount: result.data.teamLeaderCount || 0,
            teamMemberCount: result.data.teamMemberCount || 0,
            totalAmount: result.data.totalAmount || 0,
            todayCount: result.data.todayCount || 0,
            viewsCount: result.data.viewsCount || 0
          });
          console.log('活动统计数据已提交到store, viewsCount =', result.data.viewsCount);
          return result.data;
        } else {
          console.error('获取统计数据失败或格式错误:', result);
          // 设置默认值
          commit('setActivityStats', {
            totalCount: 0,
            teamLeaderCount: 0,
            teamMemberCount: 0,
            totalAmount: 0,
            todayCount: 0,
            viewsCount: 0
          });
          return null;
        }
      } catch (error) {
        console.error('加载活动统计数据失败:', error);
        // 设置默认值
        commit('setActivityStats', {
          totalCount: 0,
          teamLeaderCount: 0,
          teamMemberCount: 0,
          totalAmount: 0,
          todayCount: 0,
          viewsCount: 0
        });
        return null;
      }
    }
  },
  modules: {
  }
}) 