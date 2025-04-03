import { createStore } from 'vuex'

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
    }
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
    }
  },
  actions: {
    async loadParticipants({ commit, state }) {
      try {
        console.log('开始加载参与者数据');
        // 在实际项目中，这里应该从API获取数据
        // 这里使用模拟数据
        const mockNames = [
          '一*三', '贺*梦', 'S***e', '*', '盼**秀', 
          '段**', 'Y*****?', '我**家', 'j****k', '永**斗', 
          '曹*娟', '桃*桃', '囧****~', '李*锐', '魏**'
        ];
        
        const participants = [];
        for (let i = 0; i < 3; i++) {
          mockNames.forEach(name => {
            participants.push({
              name,
              avatar: name.substr(0, 1)
            });
          });
        }
        
        console.log('生成的参与者数据数量:', participants.length);
        commit('setParticipants', participants);
        console.log('参与者数据设置完成，当前store中数量:', state.participants.length);
      } catch (error) {
        console.error('加载参与者列表失败:', error);
      }
    },
    async loadOrders({ commit, state }) {
      try {
        // 在实际项目中，这里应该从API获取数据
        // 这里使用模拟数据
        const baseData = [
          { name: '齐*烨', phone: '187****5808', amount: state.activityConfig.price, status: '已支付', time: '2025-2-25 21:32' },
          { name: '任*格', phone: '186****0572', amount: state.activityConfig.price, status: '已支付', time: '2025-2-25 20:43' },
          { name: '王*涵', phone: '184****4513', amount: state.activityConfig.price, status: '已支付', time: '2025-2-25 20:41' },
          { name: '李*泽', phone: '137****1716', amount: state.activityConfig.price, status: '已支付', time: '2025-2-25 19:55' },
          { name: '曹*娟', phone: '132****9127', amount: state.activityConfig.price, status: '已支付', time: '2025-2-25 18:25' }
        ];
        
        const mockData = [];
        for (let i = 0; i < 4; i++) {
          baseData.forEach((order, index) => {
            const hours = 21 - Math.floor(index / 2) - i * 2;
            const minutes = 30 + (index % 2) * 15;
            const time = `2025-2-25 ${hours}:${minutes}`;
            
            mockData.push({ ...order, time });
          });
        }
        
        commit('setOrders', mockData);
      } catch (error) {
        console.error('加载订单列表失败:', error);
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
    async checkPaymentStatus({ commit, state }, orderNo) {
      try {
        // 在实际项目中，这里应该从API获取订单状态
        // 这里使用模拟逻辑
        commit('setPaymentInfo', { 
          orderNo, 
          status: 'pending',
          errorMessage: ''
        });
        
        return { status: 'pending' };
      } catch (error) {
        console.error('检查支付状态失败:', error);
        return { status: 'failed', error: error.message };
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
    }
  },
  modules: {
  }
}) 