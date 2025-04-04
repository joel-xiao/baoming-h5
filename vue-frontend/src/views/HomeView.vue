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
import { useStore } from 'vuex'
import Header from '../components/Header.vue'
import CountdownTimer from '../components/CountdownTimer.vue'
import ActivityStats from '../components/ActivityStats.vue'
import CourseInfo from '../components/CourseInfo.vue'
import OrdersList from '../components/OrdersList.vue'
import CustomerService from '../components/CustomerService.vue'
import RegistrationForm from '../components/RegistrationForm.vue'
import FixedButton from '../components/FixedButton.vue'
import DanmuContainer from '../components/DanmuContainer.vue'
import DanmuToggle from '../components/DanmuToggle.vue'
import DanmuDebug from '../components/DanmuDebug.vue'
import ScrollSync from '../components/ScrollSync.vue'

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
    const store = useStore()
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
          // 使用Vuex的action提交报名信息
          const result = await store.dispatch('submitRegistration')
          
          if (result.success) {
            // 创建支付订单对象
            const paymentOrder = {
              orderNo: result.orderNo || '', 
              amount: store.state.activityConfig.price
            }
            
            // 显示支付界面或处理支付参数
            if (result.paymentParams) {
              console.log('准备调用支付接口:', result.paymentParams)
              // 这里应该调用微信支付SDK
            }
            
            // 创建弹幕
            const danmuText = `${store.state.user.name}成功报名啦！`
            store.dispatch('triggerDanmu', { text: danmuText, userName: store.state.user.name })
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
      console.log('执行loadData函数...');
      try {
        // 首先刷新活动统计数据 - 最重要的数据
        console.log('刷新活动统计数据...');
        await store.dispatch('loadActivityStats');
        console.log('活动统计数据刷新完成:', store.state.activityStats);

        // 然后加载参与者数据
        console.log('加载参与者数据...');
        await store.dispatch('loadParticipants');
        console.log('参与者数据加载完成，数量:', store.state.participants.length);

        // 最后加载订单数据
        console.log('加载订单数据...');
        await store.dispatch('loadOrders');
        console.log('订单数据加载完成，数量:', store.state.orders.length);

        // 检查活动是否已结束
        checkActivityEnd();
        console.log('数据加载全部完成');
      } catch (error) {
        console.error('数据加载失败:', error);
        // 显示友好错误提示
        store.commit('setSystemError', {
          show: true,
          message: '数据加载失败，请刷新页面重试'
        });
      }
    }
    
    // 检查活动是否已结束
    const checkActivityEnd = () => {
      console.log('检查活动是否已结束...');
      try {
        const endTimeStr = store.state.activityConfig.endTime;
        const endTime = new Date(endTimeStr);
        const now = new Date();
        const isEnded = now > endTime;
        
        if (isEnded) {
          console.log('活动已结束');
          store.commit('setActivityEndedStatus', true);
        } else {
          console.log('活动进行中，结束时间:', endTimeStr);
          store.commit('setActivityEndedStatus', false);
        }
      } catch (error) {
        console.error('检查活动结束状态出错:', error);
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
      // 只监听一次交互
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
    
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)
    
    // 显示音乐播放提示
    setTimeout(() => {
      // 创建提示元素
      const tipElement = document.createElement('div')
      tipElement.className = 'music-tip'
      tipElement.innerHTML = '点击页面任意位置即可播放背景音乐'
      document.body.appendChild(tipElement)
      
      // 3秒后自动消失
      setTimeout(() => {
        tipElement.classList.add('fade-out')
        // 动画结束后移除元素
        setTimeout(() => {
          if (document.body.contains(tipElement)) {
            document.body.removeChild(tipElement)
          }
        }, 1000)
      }, 3000)
    }, 1000)

    onMounted(async () => {
      console.log('HomeView组件已挂载');
      
      // 统一通过loadData函数加载所有数据，避免重复API调用
      console.log('开始加载活动数据...');
      await loadData();
      
      // 启动定时刷新 - 适当延长刷新间隔
      refreshInterval.value = setInterval(async () => {
        console.log('定时刷新数据...');
        await loadData();
      }, 30000); // 30秒刷新一次
    })

    // 组件卸载时清理资源
    onUnmounted(() => {
      console.log('HomeView组件卸载，清理定时刷新...');
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
        refreshInterval.value = null;
      }
    })

    onBeforeUnmount(() => {
      // 停止音乐播放
      if (bgmRef.value) {
        bgmRef.value.pause()
        bgmRef.value.currentTime = 0
      }
    })

    return {
      bgmRef,
      isFormValid,
      isFormVisible,
      isPaymentVisible,
      handleRegistration
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