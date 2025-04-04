<template>
  <div class="payment-component">
    <div class="payment-header">
      <h2>支付报名费用</h2>
      <div class="payment-amount">¥{{ amount }}</div>
    </div>
    
    <div class="payment-info">
      <div class="info-row">
        <span class="label">订单编号：</span>
        <span class="value">{{ orderNo || '等待创建...' }}</span>
      </div>
      
      <div class="info-row">
        <span class="label">支付状态：</span>
        <span class="value status" :class="paymentStatus">{{ statusText }}</span>
      </div>
    </div>
    
    <div class="payment-actions">
      <button 
        class="payment-btn" 
        @click="createPayment" 
        :disabled="isLoading || paymentStatus === 'success'"
      >
        <span v-if="isLoading">处理中...</span>
        <span v-else-if="paymentStatus === 'success'">已支付</span>
        <span v-else>立即支付</span>
      </button>
    </div>
    
    <div class="payment-result" v-if="paymentStatus">
      <div class="result-icon" :class="paymentStatus">
        <i class="icon" :class="statusIcon"></i>
      </div>
      <div class="result-message">{{ resultMessage }}</div>
    </div>
    
    <div class="payment-error" v-if="errorMessage">
      {{ errorMessage }}
    </div>
    
    <div class="payment-tips" v-if="!paymentStatus || paymentStatus === 'pending'">
      <h3>支付提示</h3>
      <ul>
        <li>请确认您已经在微信内打开此页面</li>
        <li>点击立即支付后，请按照微信支付提示完成支付</li>
        <li>支付成功后，系统会自动为您确认报名</li>
        <li>如遇支付问题，请刷新页面重试或联系客服</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { paymentApi } from '../api'

export default {
  name: 'PaymentComponent',
  props: {
    registrationId: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    
    // 支付相关数据
    const amount = ref(99) // 默认费用
    const orderNo = ref('')
    const paymentStatus = ref('') // pending, success, failed
    const isLoading = ref(false)
    const errorMessage = ref('')
    const checkStatusTimer = ref(null)
    const resultMessage = ref('')
    
    // 从store获取用户信息
    const userInfo = computed(() => store.state.user || {})
    
    // 根据支付状态设置图标和文本
    const statusIcon = computed(() => {
      switch(paymentStatus.value) {
        case 'success': return 'check-circle'
        case 'failed': return 'close-circle'
        case 'pending': return 'time-circle'
        default: return ''
      }
    })
    
    const statusText = computed(() => {
      switch(paymentStatus.value) {
        case 'success': return '支付成功'
        case 'failed': return '支付失败'
        case 'pending': return '等待支付'
        default: return '未支付'
      }
    })
    
    // 创建支付订单
    const createPayment = async () => {
      if (isLoading.value) return
      
      try {
        isLoading.value = true
        errorMessage.value = ''
        
        // 检查用户信息
        if (!userInfo.value.name || !userInfo.value.phone) {
          errorMessage.value = '用户信息不完整，请重新登录'
          return
        }
        
        // 创建支付订单
        const response = await paymentApi.createPayment({
          openid: userInfo.value.openid || 'mock_openid_123456',
          name: userInfo.value.name,
          phone: userInfo.value.phone,
          isTeamLeader: userInfo.value.isTeamLeader || false,
          amount: amount.value
        })
        
        if (response.success) {
          // 检查是否已有已支付订单
          if (response.data.existingOrder) {
            paymentStatus.value = 'success'
            orderNo.value = response.data.orderNo
            resultMessage.value = response.data.message || '您已完成支付，无需重复支付'
            
            // 5秒后跳转到成功页面
            setTimeout(() => {
              router.push({ name: 'success', query: { orderNo: orderNo.value } })
            }, 5000)
            return
          }
          
          // 保存订单信息
          orderNo.value = response.data.orderNo
          
          // 检查是否有错误信息
          if (response.data.errorMessage) {
            errorMessage.value = response.data.errorMessage
            paymentStatus.value = 'failed'
            resultMessage.value = '创建支付订单失败，请刷新页面重试'
            return
          }
          
          // 获取支付参数
          const paymentParams = response.data.paymentParams
          
          if (!paymentParams) {
            errorMessage.value = '获取支付参数失败'
            paymentStatus.value = 'failed'
            resultMessage.value = '获取支付参数失败，请联系客服'
            return
          }
          
          // 调用微信支付
          paymentStatus.value = 'pending'
          resultMessage.value = '请在微信中完成支付'
          
          // 开始轮询支付状态
          startCheckPaymentStatus()
          
          // 在实际项目中，这里会调用微信JSAPI，示例代码：
          if (typeof WeixinJSBridge !== 'undefined') {
            WeixinJSBridge.invoke('getBrandWCPayRequest', paymentParams, (res) => {
              if (res.err_msg === 'get_brand_wcpay_request:ok') {
                // 用户支付成功
                paymentStatus.value = 'success'
                resultMessage.value = '支付成功！正在为您确认报名...'
                
                // 跳转到成功页面
                setTimeout(() => {
                  router.push({ name: 'success', query: { orderNo: orderNo.value } })
                }, 2000)
              } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
                // 用户取消支付
                paymentStatus.value = 'pending'
                resultMessage.value = '您已取消支付，可重新点击支付按钮'
              } else {
                // 支付失败
                paymentStatus.value = 'failed'
                errorMessage.value = res.err_desc || res.err_msg || '支付过程中发生错误'
                resultMessage.value = '支付失败，请重新尝试'
              }
            })
          } else {
            // 不在微信环境内
            paymentStatus.value = 'failed'
            errorMessage.value = '请在微信浏览器中打开'
            resultMessage.value = '当前环境不支持微信支付，请在微信内打开'
          }
        } else {
          errorMessage.value = response.message || '创建支付订单失败'
          paymentStatus.value = 'failed'
          resultMessage.value = '创建支付订单失败，请稍后重试'
        }
      } catch (error) {
        console.error('支付错误:', error)
        errorMessage.value = error.response?.data?.message || '支付过程中发生错误'
        paymentStatus.value = 'failed'
        resultMessage.value = '支付发生错误，请稍后重试'
      } finally {
        isLoading.value = false
      }
    }
    
    // 开始轮询检查支付状态
    const startCheckPaymentStatus = () => {
      stopCheckPaymentStatus()
      
      if (!orderNo.value) return
      
      // 每5秒检查一次，最多检查12次（1分钟）
      checkStatusTimer.value = setInterval(async () => {
        try {
          // 查询支付状态
          const response = await paymentApi.getPaymentStatus(orderNo.value)
          
          if (response.success) {
            // 更新支付状态
            paymentStatus.value = response.data.paymentStatus
            
            // 如果支付成功，停止检查并跳转
            if (paymentStatus.value === 'success') {
              resultMessage.value = '支付成功！正在为您确认报名...'
              stopCheckPaymentStatus()
              
              // 跳转到成功页面
              setTimeout(() => {
                router.push({ name: 'success', query: { orderNo: orderNo.value } })
              }, 2000)
            }
          }
        } catch (error) {
          console.error('查询支付状态错误:', error)
        }
      }, 5000)
    }
    
    // 停止检查支付状态
    const stopCheckPaymentStatus = () => {
      if (checkStatusTimer.value) {
        clearInterval(checkStatusTimer.value)
        checkStatusTimer.value = null
      }
    }
    
    // 组件挂载时自动初始化
    onMounted(() => {
      // 如果有订单号参数，则查询支付状态
      const queryOrderNo = route.query.orderNo
      if (queryOrderNo) {
        orderNo.value = queryOrderNo
        checkPaymentStatus()
      }
    })
    
    // 组件卸载时清理定时器
    onUnmounted(() => {
      stopCheckPaymentStatus()
    })
    
    // 单次检查支付状态
    const checkPaymentStatus = async () => {
      if (!orderNo.value) return
      
      try {
        isLoading.value = true
        
        const response = await paymentApi.getPaymentStatus(orderNo.value)
        
        if (response.success) {
          paymentStatus.value = response.data.paymentStatus
          
          if (paymentStatus.value === 'success') {
            resultMessage.value = '支付成功！您的报名已确认'
          } else if (paymentStatus.value === 'pending') {
            resultMessage.value = '订单等待支付中'
            startCheckPaymentStatus()
          } else {
            resultMessage.value = '支付未完成，请重新发起支付'
          }
        }
      } catch (error) {
        console.error('查询支付状态错误:', error)
        errorMessage.value = '查询支付状态失败'
      } finally {
        isLoading.value = false
      }
    }
    
    return {
      amount,
      orderNo,
      paymentStatus,
      isLoading,
      errorMessage,
      resultMessage,
      statusIcon,
      statusText,
      createPayment
    }
  }
}
</script>

<style scoped>
.payment-component {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.payment-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.payment-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b00;
}

.payment-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-row .label {
  width: 100px;
  color: #666;
}

.info-row .value {
  flex: 1;
  color: #333;
}

.status {
  font-weight: 500;
}

.status.success {
  color: #4caf50;
}

.status.pending {
  color: #ff9800;
}

.status.failed {
  color: #f44336;
}

.payment-actions {
  margin-bottom: 20px;
}

.payment-btn {
  width: 100%;
  padding: 12px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.payment-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.payment-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.result-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  font-size: 30px;
}

.result-icon.success {
  background-color: #e8f5e9;
  color: #4caf50;
}

.result-icon.pending {
  background-color: #fff8e1;
  color: #ff9800;
}

.result-icon.failed {
  background-color: #ffebee;
  color: #f44336;
}

.result-message {
  font-size: 16px;
  text-align: center;
  color: #333;
}

.payment-error {
  margin: 15px 0;
  padding: 10px 15px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 14px;
}

.payment-tips {
  margin-top: 20px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 8px;
}

.payment-tips h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #0277bd;
}

.payment-tips ul {
  padding-left: 20px;
  margin: 0;
}

.payment-tips li {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}
</style> 