<template>
  <div class="container">
    <!-- 顶部标题 -->
    <Header />

    <!-- 主要内容 -->
    <div class="content">
      <!-- 倒计时模块 -->
      <CountdownTimer />
      
      <!-- 活动统计面板 -->
      <ActivityStats />
      
      <!-- 课程介绍 -->
      <CourseInfo />

      <!-- 订单列表 -->
      <OrdersList />

      <!-- 客服按钮 -->
      <CustomerService />

      <!-- 报名表单 -->
      <RegistrationForm />
    </div>

    <!-- 底部 -->
    <div class="footer">
      <p>© 2025 尚博武道. 版权所有</p>
    </div>

    <!-- 底部支付按钮 -->
    <FixedButton />

    <!-- 背景音乐 - 添加autoplay属性和muted属性以确保自动播放 -->
    <audio id="bgm" loop autoplay muted ref="bgmRef" preload="auto">
      <source src="/audio/background.mp3" type="audio/mpeg">
    </audio>

    <!-- 弹幕容器 -->
    <DanmuContainer />
    
    <!-- 弹幕开关 -->
    <DanmuToggle />
    
    <!-- 调试工具 -->
    <DanmuDebug />
    
    <!-- 滚动同步控制器 -->
    <ScrollSync />
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { useActivity, useUser, useRegistration, useSystem, useDanmu } from '@store/hooks'
import Header from '@mobile/Header.vue'
import CountdownTimer from '@mobile/CountdownTimer.vue'
import ActivityStats from '@mobile/ActivityStats.vue'
import CourseInfo from '@mobile/CourseInfo.vue'
import OrdersList from '@mobile/OrdersList.vue'
import CustomerService from '@mobile/CustomerService.vue'
import RegistrationForm from '@mobile/RegistrationForm.vue'
import FixedButton from '@mobile/FixedButton.vue'
import DanmuContainer from '@mobile/DanmuContainer.vue'
import DanmuToggle from '@mobile/DanmuToggle.vue'
import DanmuDebug from '@mobile/DanmuDebug.vue'
import ScrollSync from '@mobile/ScrollSync.vue'

export default {
  name: 'HomeView',
  components: {
    Header,
    CountdownTimer,
    ActivityStats,
    CourseInfo,
    OrdersList,
    CustomerService,
    RegistrationForm,
    FixedButton,
    DanmuContainer,
    DanmuToggle,
    DanmuDebug,
    ScrollSync
  },
  setup() {
    // 使用模块化的store hooks
    const activity = useActivity()
    const user = useUser()
    const registration = useRegistration()
    const system = useSystem()
    const danmu = useDanmu()
    
    const bgmRef = ref(null)
    const isFormValid = ref(true)
    const isFormVisible = ref(true)
    const isPaymentVisible = ref(false)
    const refreshInterval = ref(null)
    
    // 播放背景音乐函数 - 使用更强大的逻辑
    const playBackgroundMusic = () => {
      const bgm = bgmRef.value
      if (!bgm) return

      // 首先设置静音，这样可以自动播放
      bgm.muted = true
      bgm.volume = 0.5
      
      // 尝试播放音乐
      const playPromise = bgm.play()
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('音乐开始播放(静音状态)')
          
          // 添加用户交互监听器，在交互后取消静音
          const unmuteAudio = () => {
            bgm.muted = false
            console.log('用户交互后取消静音')
            // 移除事件监听器
            document.removeEventListener('click', unmuteAudio)
            document.removeEventListener('touchstart', unmuteAudio)
          }
          
          // 添加监听器等待用户交互
          document.addEventListener('click', unmuteAudio)
          document.addEventListener('touchstart', unmuteAudio)
        }).catch(error => {
          console.log('自动播放音乐失败，可能需要用户交互:', error)
          
          // 创建一个一次性交互处理器
          const handleInteraction = () => {
            bgm.play().then(() => {
              console.log('用户交互后成功播放音乐')
              bgm.muted = false
              // 播放成功后移除事件监听器
              document.removeEventListener('click', handleInteraction)
              document.removeEventListener('touchstart', handleInteraction)
            }).catch(err => {
              console.log('尝试播放失败:', err)
            })
          }
          
          // 添加事件监听器
          document.addEventListener('click', handleInteraction)
          document.addEventListener('touchstart', handleInteraction)
        })
      }
    }
    
    // 处理报名表单提交的函数
    const handleRegistration = async () => {
      if (isFormValid.value) {
        try {
          // 使用模块化的store action提交报名信息
          const result = await registration.submitRegistration()
          
          if (result.success) {
            // 创建支付订单对象
            const paymentOrder = {
              orderNo: result.orderNo || '', 
              amount: activity.price.value
            }
            
            // 显示支付界面或处理支付参数
            if (result.paymentParams) {
              console.log('准备调用支付接口:', result.paymentParams)
              // 这里应该调用微信支付SDK
            }
          } else {
            alert(result.message || '报名失败，请稍后重试')
          }
        } catch (error) {
          console.error('报名提交失败:', error)
          alert(error.message || '报名失败，请稍后重试')
        }
      }
    }
    
    // 加载数据函数
    const loadData = async () => {
      console.log('执行loadData函数...')
      try {
        // 并行请求数据提高效率
        console.log('并行加载所有数据...')
        const [statsPromise, participantsPromise, ordersPromise] = [
          activity.loadStats(),
          registration.loadParticipants(),
          registration.loadOrders()
        ]
        
        // 使用Promise.all并行等待所有请求完成
        await Promise.all([statsPromise, participantsPromise, ordersPromise])
        
        console.log('活动统计数据刷新完成:', activity.stats.value)
        console.log('参与者数据加载完成，数量:', activity.participants.value?.length)
        console.log('订单数据加载完成，数量:', activity.orders.value?.length)

        // 检查活动是否已结束
        activity.checkActivityEnd()
        console.log('数据加载全部完成')
      } catch (error) {
        console.error('数据加载失败:', error)
        // 显示友好错误提示
        system.setError({
          show: true,
          message: '数据加载失败，请刷新页面重试'
        })
      }
    }
    
    // 立即尝试播放背景音乐
    playBackgroundMusic()
    
    // 添加通用的用户交互监听，确保用户交互后可以播放并取消静音
    const handleUserInteraction = () => {
      if (bgmRef.value) {
        if (bgmRef.value.paused) {
          // 用户交互后尝试播放
          bgmRef.value.play().then(() => {
            bgmRef.value.muted = false
            console.log('用户交互后成功播放音乐并取消静音')
          }).catch(error => {
            console.log('尽管有用户交互，播放仍然失败:', error)
          })
        } else {
          // 如果已经在播放但是还是静音状态，则取消静音
          bgmRef.value.muted = false
          console.log('用户交互后取消静音')
        }
      }
    }
    
    // 在组件挂载时
    onMounted(() => {
      console.log('HomeView组件挂载...')
      
      // 尝试播放背景音乐
      playBackgroundMusic()
      
      // 加载页面数据
      loadData()

      // 每隔60秒自动刷新数据
      refreshInterval.value = setInterval(() => {
        console.log('定时刷新数据...')
        loadData()
      }, 60000)

      // 添加用户交互监听
      document.addEventListener('click', handleUserInteraction)
      document.addEventListener('touchstart', handleUserInteraction)
    })
    
    // 在组件卸载前清除定时器和事件监听
    onBeforeUnmount(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    })
    
    return {
      bgmRef,
      isFormValid,
      isFormVisible
    }
  }
}
</script>

<style scoped>
.footer {
  background-color: #f5f5f5;
  text-align: center;
  padding: 15px;
  color: #666;
  font-size: 12px;
  margin-bottom: 60px;
}

:root {
  --animation-duration: 30s; /* 公共动画周期 */
}

/* 音乐播放提示样式 */
.music-tip {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 15px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: fade-in 0.5s ease-out;
  transition: opacity 1s ease;
}

.music-tip.fade-out {
  opacity: 0;
}

@keyframes fade-in {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style> 