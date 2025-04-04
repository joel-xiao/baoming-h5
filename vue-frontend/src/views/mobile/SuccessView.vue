<template>
  <div class="success-container">
    <div class="success-card">
      <div class="success-icon">
        <i class="iconfont icon-check-circle"></i>
      </div>
      <h2 class="success-title">报名成功</h2>
      <div class="success-info">
        <template v-if="registrationInfo">
          <div class="info-item">
            <span class="label">姓名</span>
            <span class="value">{{ registrationInfo.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">电话</span>
            <span class="value">{{ maskPhone(registrationInfo.phone) }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付金额</span>
            <span class="value price">¥{{ registrationInfo.amount }}</span>
          </div>
          <div class="info-item">
            <span class="label">订单号</span>
            <span class="value order-no">{{ registrationInfo.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">报名时间</span>
            <span class="value">{{ formatDate(registrationInfo.createdAt) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="loading-info">
            <div class="spinner"></div>
            <p>正在获取报名信息...</p>
          </div>
        </template>
      </div>
      
      <div v-if="isTeamLeader" class="team-info">
        <div class="team-id">
          <h3>团队ID</h3>
          <div class="team-id-value">{{ teamId }}</div>
          <button @click="copyTeamId" class="copy-btn">
            {{ isCopied ? '已复制' : '复制团队ID' }}
          </button>
        </div>
        <p class="team-tip">请将团队ID分享给队员，邀请他们加入您的团队</p>
      </div>
      
      <div class="action-buttons">
        <button class="share-btn" @click="shareRegistration">分享报名</button>
        <button class="home-btn" @click="goToHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { paymentApi } from '@api'
import { useApi } from '@api/hooks/useApi'
import toast from '../../utils/toast'

export default {
  name: 'SuccessView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const isCopied = ref(false)
    
    const orderNo = computed(() => route.query.orderNo || '')
    
    // 使用useApi Hook封装API调用逻辑
    const { 
      data: paymentData, 
      loading: isLoading, 
      error, 
      execute: checkPayment 
    } = useApi(
      () => paymentApi.getPaymentStatus(orderNo.value),
      {
        onError: (err) => {
          console.error('获取报名信息失败:', err)
          toast.error('获取订单信息失败，请稍后再试')
          router.push('/')
        }
      }
    )
    
    // 将API返回的数据转换为组件所需格式
    const registrationInfo = computed(() => {
      if (!paymentData.value) return null
      
      return {
        name: paymentData.value.name,
        phone: paymentData.value.phone,
        amount: paymentData.value.paymentAmount,
        orderNo: paymentData.value.orderNo || orderNo.value,
        isTeamLeader: paymentData.value.isTeamLeader,
        teamId: paymentData.value.teamId,
        createdAt: paymentData.value.paymentTime || paymentData.value.createdAt
      }
    })
    
    // 计算属性
    const isTeamLeader = computed(() => registrationInfo.value?.isTeamLeader || false)
    const teamId = computed(() => registrationInfo.value?.teamId || orderNo.value || '')
    
    // 监视orderNo变化自动请求
    watch(orderNo, (newValue) => {
      if (newValue) {
        checkPayment()
      } else {
        router.push('/')
      }
    }, { immediate: true })
    
    // 监视支付状态自动轮询
    watch(paymentData, (newValue) => {
      if (newValue && newValue.paymentStatus === 'pending') {
        // 轮询检查支付状态
        setTimeout(() => {
          checkPayment()
        }, 3000)
      } else if (newValue && newValue.paymentStatus !== 'success') {
        // 支付失败或出错，返回首页
        toast.error('支付未成功，请重新报名')
        router.push('/')
      }
    })
    
    const maskPhone = (phone) => {
      if (!phone || phone.length !== 11) return phone
      return phone.substring(0, 3) + '****' + phone.substring(7)
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    const copyTeamId = () => {
      if (!teamId.value) return
      
      const textarea = document.createElement('textarea')
      textarea.value = teamId.value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    }
    
    const shareRegistration = () => {
      // 这里可以实现微信分享功能
      // eslint-disable-next-line no-undef
      if (typeof wx !== 'undefined' && wx.ready) {
        // eslint-disable-next-line no-undef
        wx.ready(() => {
          // eslint-disable-next-line no-undef
          wx.updateAppMessageShareData({
            title: '我已成功报名武道开学活动',
            desc: '快来和我一起参加吧！',
            link: window.location.href,
            imgUrl: window.location.origin + '/logo.png',
            success: function() {
              // 设置成功
            }
          })
        })
      } else {
        toast.warning('请在微信客户端中分享')
      }
    }
    
    const goToHome = () => {
      router.push('/')
    }
    
    return {
      registrationInfo,
      isLoading,
      isTeamLeader,
      teamId,
      isCopied,
      maskPhone,
      formatDate,
      copyTeamId,
      shareRegistration,
      goToHome
    }
  }
}
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 30px 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.success-icon {
  font-size: 64px;
  color: #07c160;
  margin-bottom: 16px;
}

.success-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
}

.success-info {
  margin-bottom: 24px;
  text-align: left;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
}

.info-item .label {
  color: #666;
}

.info-item .value {
  font-weight: 500;
  color: #333;
}

.info-item .value.price {
  color: #ff6b00;
  font-weight: bold;
}

.info-item .value.order-no {
  font-family: monospace;
  font-size: 12px;
}

.loading-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #eaeaea;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.team-info {
  background-color: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.team-id h3 {
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
}

.team-id-value {
  font-size: 24px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 10px;
  font-family: monospace;
  padding: 8px;
  background-color: #e6f7ff;
  border-radius: 4px;
}

.copy-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.team-tip {
  font-size: 12px;
  color: #666;
  margin-top: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.share-btn, .home-btn {
  flex: 1;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.share-btn {
  background-color: #07c160;
  color: #fff;
  border: none;
}

.home-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}
</style> 