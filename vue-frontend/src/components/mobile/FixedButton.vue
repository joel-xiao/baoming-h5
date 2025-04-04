<template>
  <div class="fixed-bottom-btn">
    <button class="pay-btn" @click="handleAction" 
      :disabled="isActivityEnded || isSubmitting" 
      :class="{
        'disabled': isActivityEnded,
        'processing': isSubmitting
      }">
      <span class="price-tag">¥<strong>{{ price }}</strong><small>.00</small></span>
      <span class="btn-text">
        <template v-if="isActivityEnded">活动已结束</template>
        <template v-else-if="isSubmitting">
          <span class="loading-spinner"></span>支付中...
        </template>
        <template v-else-if="!isFormVisible">立即报名</template>
        <template v-else>确认并支付</template>
      </span>
    </button>
  </div>
</template>

<script>
import { computed, ref, provide, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivity, useUser, useDanmu, useSystem } from '@/store/hooks'

export default {
  name: 'FixedButton',
  setup() {
    const router = useRouter()
    
    // 使用模块化hooks
    const activity = useActivity()
    const user = useUser()
    const danmu = useDanmu()
    const system = useSystem()
    
    const isFormVisible = ref(false)
    const isSubmitting = ref(false)
    const isPaymentVisible = ref(false)
    const orderInfo = ref({})
    
    // 使用activity.price获取价格，并提供默认值
    const price = computed(() => {
      // 确保activity.price存在，如果不存在则返回默认值99
      if (!activity || !activity.price || activity.price.value === undefined) {
        return 99
      }
      return activity.price.value
    })
    
    const isActivityEnded = computed(() => activity.activityEnded.value)
    
    // 监控表单可见性
    const watchFormVisibility = () => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.target.id === 'registration-form') {
            const isVisible = mutation.target.style.display !== 'none'
            isFormVisible.value = isVisible
          }
        }
      })
      
      const formElement = document.getElementById('registration-form')
      if (formElement) {
        observer.observe(formElement, { attributes: true, attributeFilter: ['style'] })
      }
    }
    
    // 处理按钮点击
    const handleAction = () => {
      // 检查状态，只在可用时处理
      if (isActivityEnded.value || isSubmitting.value) {
        return
      }
      
      // 如果表单未显示，则显示表单
      if (!isFormVisible.value) {
        user.submitHandler()
        
        // 用户点击时触发弹幕效果
        danmu.triggerSpecialDanmu({
          type: 'action',
          text: '我要报名',
          userName: ''
        })
      } else {
        // 如果表单已显示，则触发表单提交
        const formButton = document.querySelector('#registration-form .submit-btn')
        if (formButton) {
          formButton.click()
        }
      }
    }
    
    // 显示支付界面的方法
    const showPayment = (paymentData) => {
      orderInfo.value = paymentData
      isPaymentVisible.value = true
    }
    
    // 暴露showPayment给其他组件使用
    provide('showPayment', showPayment)
    
    // 处理支付成功
    const handlePaymentSuccess = (data) => {
      // 触发成功弹幕
      danmu.triggerSpecialDanmu({
        type: 'success',
        text: '报名成功啦！',
        userName: orderInfo.value.name
      })
      
      // 跳转到成功页面
      setTimeout(() => {
        router.push({
          path: '/success',
          query: { orderNo: data.orderNo }
        })
      }, 1500)
    }
    
    // 处理支付失败
    const handlePaymentFailed = (data) => {
      system.setError({
        show: true,
        message: data.error || '支付过程中发生错误'
      })
    }
    
    // 处理支付关闭
    const handlePaymentClosed = () => {
      // 支付关闭的处理逻辑
    }
    
    onMounted(() => {
      watchFormVisibility()
    })
    
    return {
      price,
      isFormVisible,
      isSubmitting,
      handleAction,
      isActivityEnded,
      isPaymentVisible,
      orderInfo,
      handlePaymentSuccess,
      handlePaymentFailed,
      handlePaymentClosed
    }
  }
}
</script>

<style scoped>
.fixed-bottom-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 10px 15px;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.ended-banner {
  background-color: #ff9800 !important;
}

.time-error-banner {
  background-color: #ff4b2b;
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  text-align: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
}

.pay-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  border: none;
  border-radius: 26px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 6px 12px rgba(255, 75, 43, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;
  overflow: hidden;
  position: relative;
}

.pay-btn.disabled {
  background: linear-gradient(135deg, #cccccc, #999999);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  cursor: not-allowed;
}

.pay-btn.processing {
  background: linear-gradient(135deg, #e04c65, #e04c65);
  box-shadow: 0 4px 8px rgba(224, 76, 101, 0.3);
}

.pay-btn:not(.disabled):not(.processing):active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(255, 75, 43, 0.3);
}

.pay-btn:disabled {
  cursor: not-allowed;
}

.pay-btn:not(.disabled):not(.processing):before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.7s ease;
}

.pay-btn:not(.disabled):not(.processing):hover:before {
  left: 100%;
}

.pay-btn span {
  position: relative;
  z-index: 2;
  letter-spacing: 1px;
}

.price-tag {
  display: flex;
  align-items: baseline;
  font-weight: bold;
  margin-right: 12px;
}

.price-tag strong {
  font-size: 24px;
  margin: 0 2px;
}

.price-tag small {
  font-size: 14px;
  opacity: 0.9;
}

.btn-text {
  font-size: 16px;
  position: relative;
  display: flex;
  align-items: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 添加媒体查询，适应不同屏幕尺寸 */
@media (min-width: 768px) {
  .fixed-bottom-btn {
    padding: 15px;
    max-width: 90%;
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (min-width: 1200px) {
  .fixed-bottom-btn {
    max-width: 1140px;
  }
}
</style> 