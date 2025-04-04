<template>
  <div class="countdown-container">
    <div class="countdown-content">
      <div class="countdown-title">
        {{timeEnded ? '活动已经结束了' : '距离报名结束还剩'}}
      </div>
      <div class="countdown">
        <div class="countdown-item">
          <div class="countdown-number">{{ days }}</div>
          <div class="countdown-label">天</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-number">{{ hours < 10 ? '0' + hours : hours }}</div>
          <div class="countdown-label">时</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-number">{{ minutes < 10 ? '0' + minutes : minutes }}</div>
          <div class="countdown-label">分</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-number">{{ seconds < 10 ? '0' + seconds : seconds }}</div>
          <div class="countdown-label">秒</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { useActivity } from '@/store/hooks';
import { timeApi } from '@/api';

export default defineComponent({
  name: 'CountdownTimer',
  setup() {
    // 使用活动相关的hooks
    const activity = useActivity();
    
    // 活动结束时间
    const endTimeStr = computed(() => activity.endTime.value);
    
    // 定义响应式状态
    const days = ref(0);
    const hours = ref(0);
    const minutes = ref(0);
    const seconds = ref(0);
    const timeEnded = ref(false);
    const timeOffset = ref(0);
    const endTime = ref(0);
    
    let timerInterval = null;
    let syncInterval = null;
    
    // 更新倒计时 - 在前端计算
    const updateCountdown = () => {
      // 计算当前时间（本地时间+服务器时间偏移）
      const now = Date.now() + timeOffset.value;
      // 剩余毫秒数
      const timeLeft = Math.max(0, endTime.value - now);
      
      // 计算各时间单位
      const secs = Math.floor((timeLeft / 1000) % 60);
      const mins = Math.floor((timeLeft / (1000 * 60)) % 60);
      const hrs = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
      const dys = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      
      days.value = dys;
      hours.value = hrs;
      minutes.value = mins;
      seconds.value = secs;
      
      // 检查是否结束
      if (timeLeft <= 0 && !timeEnded.value) {
        timeEnded.value = true;
        activity.checkActivityEnd();
      }
    };
    
    // 只同步服务器时间，不获取剩余时间
    const syncTime = async () => {
      try {
        const startTime = Date.now();
        const response = await timeApi.getServerTime();
        
        if (response?.success && response.data && response.data.timestamp) {
          const serverTime = response.data.timestamp;
          const roundTrip = Date.now() - startTime;
          // 计算偏移量，考虑网络延迟
          const networkDelay = Math.floor(roundTrip / 2);
          timeOffset.value = serverTime - Date.now() + networkDelay;
          
          // 保存到localStorage
          try {
            localStorage.setItem('timeOffset', timeOffset.value.toString());
          } catch (e) {
            // 忽略存储错误
          }
          
          updateCountdown();
          return true;
        } else {
          console.error('获取服务器时间失败，返回数据无效', response);
          return false;
        }
      } catch (error) {
        console.error('同步服务器时间失败:', error);
        return false;
      }
    };
    
    // 监听endTimeStr变化
    const updateEndTime = () => {
      try {
        endTime.value = new Date(endTimeStr.value).getTime();
        if (isNaN(endTime.value)) {
          throw new Error('无效的日期格式');
        }
      } catch (error) {
        console.error('解析截止时间出错:', error);
        // 设置一个默认值（当前时间后一天）
        endTime.value = Date.now() + 24 * 60 * 60 * 1000;
      }
    };
    
    onMounted(() => {
      // 设置活动结束时间
      updateEndTime();
      
      // 尝试从localStorage读取偏移量
      try {
        const savedOffset = localStorage.getItem('timeOffset');
        if (savedOffset) {
          timeOffset.value = Number(savedOffset);
        }
      } catch (e) {
        // 忽略localStorage访问错误
      }
      
      // 首次立即同步时间
      syncTime();
      
      // 设置定时更新倒计时 - 每秒更新一次
      timerInterval = setInterval(() => {
        updateCountdown();
      }, 1000);
      
      // 定时同步服务器时间 - 每5分钟同步一次
      syncInterval = setInterval(() => {
        syncTime();
      }, 5 * 60 * 1000);
    });
    
    onBeforeUnmount(() => {
      if (timerInterval) clearInterval(timerInterval);
      if (syncInterval) clearInterval(syncInterval);
    });
    
    return {
      days,
      hours,
      minutes,
      seconds,
      timeEnded
    };
  }
});
</script>

<style scoped>
.countdown-container {
  width: 100%;
  margin: 15px 0;
  text-align: center;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.countdown-content {
  background: linear-gradient(180deg, #fff8e8 0%, #ffe6c1 100%);
  padding: 15px;
}

.countdown {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 300px;
  margin: 0 auto;
}

.countdown-item {
  flex: 1;
  text-align: center;
  margin: 0 5px;
}

.countdown-number {
  background-color: #e53935;
  color: white;
  font-size: 24px;
  font-weight: bold;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
}

.countdown-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.countdown-title {
  font-size: 16px;
  color: #e53935;
  margin-bottom: 10px;
  font-weight: bold;
}

/* 移动设备样式适配 */
@media (max-width: 768px) {
  .countdown {
    max-width: 280px;
  }
  
  .countdown-number {
    font-size: 22px;
    height: 36px;
  }
}

/* 修改标题文字颜色，使所有标题保持一致风格 */
.countdown-header .countdown-title {
  color: white;
  font-size: 16px;
}
</style> 