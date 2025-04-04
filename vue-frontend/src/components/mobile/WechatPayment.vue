<template>
  <div class="payment-container" v-if="isVisible">
    <div class="payment-overlay" @click="closePayment"></div>
    <div class="payment-panel">
      <div class="payment-header">
        <h3>支付报名费用</h3>
        <span class="close-btn" @click="closePayment">×</span>
      </div>
      
      <div class="payment-content">
        <div class="payment-info">
          <div class="payment-amount">支付金额: <span>¥{{ amount }}</span></div>
          <div class="payment-order">订单号: {{ orderNo }}</div>
        </div>
        
        <div class="payment-status" v-if="paymentStatus">
          <div class="status-icon" :class="paymentStatus">
            <i :class="statusIcon"></i>
          </div>
          <div class="status-text">{{ statusText }}</div>
        </div>
        
        <div class="payment-actions" v-if="!paymentStatus || paymentStatus === 'pending'">
          <button 
            class="btn pay-btn" 
            @click="initiatePayment" 
            :disabled="isLoading"
          >
            {{ isLoading ? '正在处理...' : '立即支付' }}
          </button>
        </div>
        
        <div class="payment-tips" v-if="errorMessage">
          <p class="error-message">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

/* global WeixinJSBridge */

export default {
  name: 'WechatPayment',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    orderInfo: {
      type: Object,
      default: () => ({
        orderNo: '',
        orderId: '',
        amount: 99,
        userType: '',
        teamCode: '',
        registrationId: ''
      })
    }
  },
  emits: ['update:isVisible', 'paymentSuccess', 'paymentFailed', 'paymentClosed'],
  setup(props, { emit }) {
    const store = useStore()
    const amount = ref(99)
    const orderNo = ref('')
    const orderId = ref('')
    const isLoading = ref(false)
    const paymentStatus = ref('')
    const errorMessage = ref('')
    const statusCheckTimer = ref(null)
    
    const userInfo = computed(() => store.state.user)
    
    // 支付状态对应的图标
    const statusIcon = computed(() => {
      switch(paymentStatus.value) {
        case 'success': return 'iconfont icon-check-circle'
        case 'failed': return 'iconfont icon-close-circle'
        case 'pending': return 'iconfont icon-time-circle'
        default: return ''
      }
    })
    
    // 支付状态文本
    const statusText = computed(() => {
      switch(paymentStatus.value) {
        case 'success': return '支付成功'
        case 'failed': return '支付失败'
        case 'pending': return '等待支付'
        default: return ''
      }
    })
    
    // 监听订单信息变化
    const updateOrderInfo = () => {
      if (props.orderInfo) {
        orderNo.value = props.orderInfo.orderNo || ''
        orderId.value = props.orderInfo.orderId || ''
        amount.value = props.orderInfo.amount || 99
      }
    }
    
    // 发起微信支付
    const initiatePayment = async () => {
      if (isLoading.value) return
      
      try {
        isLoading.value = true
        errorMessage.value = ''
        
        // 如果已有订单号，直接查询支付状态
        if (orderNo.value) {
          await checkPaymentStatus()
          if (paymentStatus.value === 'success') {
            emit('paymentSuccess', { orderNo: orderNo.value })
            return
          }
        }
        
        // 创建支付订单
        const response = await axios.post('/api/payment/create', {
          registrationId: props.orderInfo.registrationId || '',
          openid: userInfo.value.openid,
          name: userInfo.value.name,
          phone: userInfo.value.phone,
          isTeamLeader: props.orderInfo.userType === 'team_leader',
          teamCode: props.orderInfo.teamCode,
          amount: amount.value
        })
        
        if (response.data.success) {
          // 检查是否已有已支付订单
          if (response.data.data.existingOrder) {
            paymentStatus.value = 'success'
            orderNo.value = response.data.data.orderNo
            emit('paymentSuccess', { orderNo: orderNo.value, message: response.data.data.message })
            return
          }

          const { paymentParams, orderNo: newOrderNo, orderId: newOrderId } = response.data.data
          
          // 更新订单信息
          orderNo.value = newOrderNo
          orderId.value = newOrderId
          
          // 检查是否有错误信息
          if (response.data.data.errorMessage) {
            errorMessage.value = response.data.data.errorMessage
            paymentStatus.value = 'failed'
            emit('paymentFailed', { orderNo: orderNo.value, error: response.data.data.errorMessage })
            return
          }
          
          // 检查支付参数
          if (!paymentParams) {
            errorMessage.value = '获取支付参数失败'
            paymentStatus.value = 'failed'
            emit('paymentFailed', { orderNo: orderNo.value, error: '获取支付参数失败' })
            return
          }
          
          // 调用微信支付
          if (typeof WeixinJSBridge !== 'undefined') {
            paymentStatus.value = 'pending'
            
            // 开始定时检查支付状态
            startStatusCheck()
            
            WeixinJSBridge.invoke('getBrandWCPayRequest', paymentParams, (res) => {
              if (res.err_msg === 'get_brand_wcpay_request:ok') {
                // 支付成功
                paymentStatus.value = 'success'
                errorMessage.value = ''
                emit('paymentSuccess', { orderNo: orderNo.value })
              } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
                // 用户取消
                errorMessage.value = '支付已取消，您可以重新发起支付'
                paymentStatus.value = '' // 清空状态允许重试
              } else {
                // 支付失败
                paymentStatus.value = 'failed'
                errorMessage.value = '支付失败: ' + (res.err_desc || res.err_msg)
                emit('paymentFailed', { orderNo: orderNo.value, error: res.err_desc || res.err_msg })
              }
            })
          } else {
            // 不在微信环境
            errorMessage.value = '请在微信客户端中打开'
            paymentStatus.value = 'failed'
          }
        } else {
          errorMessage.value = response.data.message || '创建支付订单失败'
          paymentStatus.value = 'failed'
        }
      } catch (error) {
        console.error('支付发起错误:', error)
        errorMessage.value = error.response?.data?.message || '支付过程中发生错误'
        paymentStatus.value = 'failed'
        emit('paymentFailed', { orderNo: orderNo.value, error: errorMessage.value })
      } finally {
        isLoading.value = false
      }
    }
    
    // 检查支付状态
    const checkPaymentStatus = async () => {
      if (!orderNo.value) return
      
      try {
        const response = await axios.get(`/api/payment/status/${orderNo.value}`)
        
        if (response.data.success) {
          paymentStatus.value = response.data.data.paymentStatus
          
          if (paymentStatus.value === 'success') {
            errorMessage.value = ''
            emit('paymentSuccess', { orderNo: orderNo.value })
            stopStatusCheck()
          }
        }
      } catch (error) {
        console.error('查询支付状态错误:', error)
        // 查询出错不影响界面状态
      }
    }
    
    // 开始定期检查支付状态
    const startStatusCheck = () => {
      stopStatusCheck()
      // 5秒检查一次支付状态，最多检查12次（1分钟）
      let checkCount = 0
      statusCheckTimer.value = setInterval(() => {
        checkCount++
        checkPaymentStatus()
        if (checkCount >= 12) {
          stopStatusCheck()
          // 如果1分钟后仍未支付成功，显示提示
          if (paymentStatus.value !== 'success') {
            errorMessage.value = '支付似乎花费了较长时间，请检查您的微信支付是否已完成，或重试'
          }
        }
      }, 5000)
    }
    
    // 停止定期检查
    const stopStatusCheck = () => {
      if (statusCheckTimer.value) {
        clearInterval(statusCheckTimer.value)
        statusCheckTimer.value = null
      }
    }
    
    // 关闭支付面板
    const closePayment = () => {
      stopStatusCheck()
      emit('update:isVisible', false)
      emit('paymentClosed', { orderNo: orderNo.value })
    }
    
    onMounted(() => {
      updateOrderInfo()
      
      // 如果有订单号，查询支付状态
      if (props.isVisible && orderNo.value) {
        checkPaymentStatus()
        startStatusCheck()
      }
    })
    
    onUnmounted(() => {
      stopStatusCheck()
    })
    
    return {
      amount,
      orderNo,
      isLoading,
      paymentStatus,
      errorMessage,
      statusIcon,
      statusText,
      initiatePayment,
      closePayment
    }
  }
}
</script>

<style scoped>
.payment-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
}

.payment-panel {
  position: relative;
  width: 90%;
  max-width: 360px;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #07c160;
  color: #fff;
}

.payment-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.payment-content {
  padding: 20px;
}

.payment-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f7f7f7;
  border-radius: 8px;
}

.payment-amount {
  font-size: 16px;
  margin-bottom: 8px;
}

.payment-amount span {
  font-weight: bold;
  font-size: 20px;
  color: #ff6b00;
}

.payment-order {
  font-size: 14px;
  color: #666;
}

.payment-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}

.status-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.status-icon.success {
  color: #07c160;
}

.status-icon.failed {
  color: #fa5151;
}

.status-icon.pending {
  color: #ffc300;
}

.status-text {
  font-size: 16px;
  font-weight: 500;
}

.payment-actions {
  margin-top: 24px;
}

.pay-btn {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  background-color: #07c160;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.pay-btn:disabled {
  background-color: #a0d9b4;
  cursor: not-allowed;
}

.error-message {
  color: #fa5151;
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
}
</style> 