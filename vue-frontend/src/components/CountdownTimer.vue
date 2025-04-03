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
import axios from 'axios';
import { defineComponent } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'CountdownTimer',
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      timeEnded: false,
      timeOffset: 0,
      timerInterval: null,
      syncInterval: null,
      endTime: 0,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  },
  created() {
    console.log('设备类型:', this.isMobile ? '移动设备' : '桌面设备');
    
    // 从store获取截止时间
    const endTimeStr = this.store.state.activityConfig.endTime;
    try {
      this.endTime = new Date(endTimeStr).getTime();
      if (isNaN(this.endTime)) {
        throw new Error('无效的日期格式');
      }
      console.log('设置截止时间:', new Date(this.endTime).toISOString());
    } catch (error) {
      console.error('解析截止时间出错:', error);
      // 设置一个默认值（当前时间后一天）
      this.endTime = Date.now() + 24 * 60 * 60 * 1000;
    }
    
    // 尝试从localStorage读取偏移量
    try {
      const savedOffset = localStorage.getItem('timeOffset');
      if (savedOffset) {
        this.timeOffset = Number(savedOffset);
        console.log('使用保存的时间偏移:', this.timeOffset);
      }
    } catch (e) {
      // 忽略localStorage访问错误
      console.warn('读取本地存储失败，使用默认值');
    }
    
    // 首次立即同步时间
    this.syncTime();
    
    // 设置定时更新
    this.timerInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
    
    // 定时同步网络时间
    const syncInterval = this.isMobile ? 10 * 60 * 1000 : 5 * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.syncTime();
    }, syncInterval);
  },
  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
  },
  methods: {
    // 更新倒计时
    updateCountdown() {
      // 当前时间加偏移
      const now = Date.now() + this.timeOffset;
      // 剩余毫秒数
      const timeLeft = Math.max(0, this.endTime - now);
      
      // 计算各时间单位
      const seconds = Math.floor((timeLeft / 1000) % 60);
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      
      this.days = days;
      this.hours = hours;
      this.minutes = minutes;
      this.seconds = seconds;
      
      // 检查是否结束
      if (timeLeft <= 0 && !this.timeEnded) {
        this.timeEnded = true;
        this.store.commit('setActivityEndedStatus', true);
      }
    },
    
    // 同步网络时间
    async syncTime() {
      try {
        // 使用淘宝时间API
        const startTime = Date.now();
        const response = await axios.get('https://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp', { 
          timeout: 3000 
        });
        
        if (response?.data?.data?.t) {
          const serverTime = parseInt(response.data.data.t);
          const roundTrip = Date.now() - startTime;
          // 计算偏移量，考虑网络延迟
          const networkDelay = Math.floor(roundTrip / 2);
          this.timeOffset = serverTime - Date.now() + networkDelay;
          
          // 保存到localStorage
          try {
            localStorage.setItem('timeOffset', this.timeOffset.toString());
          } catch (e) {
            // 忽略存储错误
            console.warn('无法保存时间偏移到存储');
          }
          
          console.log('时间同步完成，偏移量:', this.timeOffset, 'ms');
          this.updateCountdown();
          return true;
        }
      } catch (error) {
        console.error('同步时间失败:', error.message);
      }
      
      // 备用方法：获取百度首页头信息中的时间
      try {
        const startTime = Date.now();
        const response = await axios.head('https://www.baidu.com', { timeout: 3000 });
        if (response?.headers?.date) {
          const serverDate = new Date(response.headers.date);
          if (!isNaN(serverDate.getTime())) {
            const roundTrip = Date.now() - startTime;
            const networkDelay = Math.floor(roundTrip / 2);
            // 调整为北京时间（+8小时）
            const serverTime = serverDate.getTime() + 8 * 60 * 60 * 1000;
            this.timeOffset = serverTime - Date.now() + networkDelay;
            
            // 保存到localStorage
            try {
              localStorage.setItem('timeOffset', this.timeOffset.toString());
            } catch (e) {
              // 忽略存储错误
              console.warn('无法保存备用时间偏移到存储');
            }
            
            console.log('备用方式同步完成，偏移量:', this.timeOffset, 'ms');
            this.updateCountdown();
            return true;
          }
        }
      } catch (error) {
        console.error('备用同步方法失败:', error.message);
      }
      
      return false;
    }
  }
})
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