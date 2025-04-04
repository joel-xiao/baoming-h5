<template>
  <div class="form-container" id="registration-form" v-show="isFormVisible">
    <h2>填写报名信息</h2>
    <div class="form-group">
      <label for="name">姓名</label>
      <input type="text" id="name" v-model="name" placeholder="请输入姓名">
    </div>
    <div class="form-group">
      <label for="phone">手机号</label>
      <input type="tel" id="phone" v-model="phone" placeholder="请输入手机号">
    </div>
    <div class="registration-type">
      <div 
        class="type-item" 
        :class="{ active: userType === 'team_leader' }" 
        @click="selectUserType('team_leader')"
      >
        <h3>我要做队长</h3>
        <p>支付{{ price }}元成为队长</p>
      </div>
      <div 
        class="type-item" 
        :class="{ active: userType === 'team_member' }" 
        @click="selectUserType('team_member')"
      >
        <h3>我要加入团队</h3>
        <p>输入团队ID加入</p>
      </div>
    </div>
    
    <div class="team-code-container" v-show="userType === 'team_member'">
      <div class="form-group">
        <label for="team-code">团队ID</label>
        <input type="text" id="team-code" v-model="teamCode" placeholder="请输入团队ID">
      </div>
    </div>
    
    <button class="submit-btn" @click="submitRegistration" :disabled="isSubmitting || isActivityEnded">
      <span v-if="isSubmitting" class="btn-loading-text">
        <span class="loading-dot"></span>
        提交中...
      </span>
      <span v-else>
        {{ isActivityEnded ? '活动已结束' : '确认并支付' }}
      </span>
    </button>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useActivity, useUser, useRegistration, useDanmu } from '@/store/hooks'

export default {
  name: 'RegistrationForm',
  props: {
    isFormVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:isFormVisible'],
  setup(props, { emit }) {
    const router = useRouter()
    
    // 使用模块化hooks
    const activity = useActivity()
    const user = useUser()
    const registration = useRegistration()
    const danmu = useDanmu()
    
    const name = ref('')
    const phone = ref('')
    const userType = ref('team_leader')
    const teamCode = ref('')
    const isSubmitting = ref(false)
    const isNetworkTimeAvailable = ref(true)
    
    // 使用activity.price获取价格，并提供默认值
    const price = computed(() => {
      // 确保activity.price存在，如果不存在则返回默认值99
      if (!activity || !activity.price || activity.price.value === undefined) {
        return 99
      }
      return activity.price.value
    })
    
    const isActivityEnded = computed(() => activity.activityEnded.value)
    
    const selectUserType = (type) => {
      userType.value = type
      user.setUserType(type)
      
      // 触发弹幕
      if (name.value) {
        const danmuText = type === 'team_leader' ? '成为队长啦！' : '加入团队啦！'
        danmu.triggerSpecialDanmu({
          type: 'team',
          text: danmuText,
          userName: name.value
        })
      }
    }
    
    const validateForm = () => {
      // 先检查状态，只在可用时继续
      if (!isNetworkTimeAvailable.value || isActivityEnded.value) {
        return false
      }
      
      if (!name.value.trim()) {
        alert('请输入姓名')
        return false
      }
      
      if (!phone.value.trim()) {
        alert('请输入手机号')
        return false
      }
      
      if (!/^1\d{10}$/.test(phone.value.trim())) {
        alert('请输入正确的手机号')
        return false
      }
      
      if (userType.value === 'team_member' && !teamCode.value.trim()) {
        alert('请输入团队ID')
        return false
      }
      
      return true
    }
    
    const submitRegistration = async () => {
      if (!validateForm()) return
      
      // 更新用户信息
      user.updateUserInfo({ name: name.value, phone: phone.value })
      if (userType.value === 'team_member') {
        user.setTeamCode(teamCode.value)
      }
      
      isSubmitting.value = true
      
      try {
        // 提交报名信息
        const result = await registration.submitRegistration()
        
        if (result.success) {
          // 判断是否有微信支付参数
          if (result.paymentParams) {
            // 调用微信支付SDK
            // eslint-disable-next-line no-undef
            if (typeof wx !== 'undefined' && wx.chooseWXPay) {
              // 调用微信支付
              // eslint-disable-next-line no-undef
              wx.chooseWXPay({
                timestamp: result.paymentParams.timeStamp,
                nonceStr: result.paymentParams.nonceStr,
                package: result.paymentParams.package,
                signType: result.paymentParams.signType,
                paySign: result.paymentParams.paySign,
                success: function(res) {
                  // 支付成功，跳转到成功页面
                  router.push({ 
                    path: '/success',
                    query: { orderNo: result.orderNo }
                  });
                },
                fail: function(res) {
                  alert('支付失败，请重试');
                  isSubmitting.value = false;
                },
                cancel: function(res) {
                  alert('支付已取消');
                  isSubmitting.value = false;
                }
              });
            } else {
              // 非微信环境，显示错误
              alert('请在微信环境中完成支付');
              isSubmitting.value = false;
            }
          } else if (result.orderNo) {
            // 有订单号但没有支付参数，直接跳转到成功页面
            router.push({ 
              path: '/success',
              query: { orderNo: result.orderNo }
            });
            isSubmitting.value = false;
          } else {
            // 没有订单号
            alert('创建订单失败，请稍后再试');
            isSubmitting.value = false;
          }
        } else {
          alert(result.message || '提交失败，请稍后重试');
          isSubmitting.value = false;
        }
      } catch (error) {
        alert(error.message || '提交失败，请稍后重试');
        isSubmitting.value = false;
      }
    }
    
    return {
      name,
      phone,
      userType,
      teamCode,
      isSubmitting,
      price,
      selectUserType,
      submitRegistration,
      isNetworkTimeAvailable,
      isActivityEnded
    }
  }
}
</script>

<style scoped>
.form-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-container h2 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.registration-type {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.type-item {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.type-item:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.05);
  opacity: 0;
  transition: opacity 0.3s;
}

.type-item:active:before {
  opacity: 1;
}

.type-item.active {
  border-color: #e53935;
  background-color: #fff9f9;
  box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.2);
}

.type-item h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}

.type-item p {
  font-size: 14px;
  color: #666;
}

.team-code-container {
  margin-top: 15px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  display: none;
}

.submit-btn:hover {
  background-color: #d32f2f;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.network-time-error {
  color: #e53935;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}

.activity-ended {
  color: #ff9800;
}

.error-icon {
  margin-right: 5px;
}

.btn-loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-dot {
  width: 4px;
  height: 4px;
  background-color: white;
  border-radius: 50%;
  margin: 0 2px;
  animation: blink 1.4s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style> 