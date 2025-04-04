<template>
  <div>
    <SystemErrorNotice />
    <ApiErrorHandler />
    <router-view/>
  </div>
</template>

<script>
import SystemErrorNotice from '@mobile/SystemErrorNotice.vue'
import ApiErrorHandler from './components/ApiErrorHandler.vue'

export default {
  name: 'App',
  components: {
    SystemErrorNotice,
    ApiErrorHandler
  }
}
</script>

<style lang="scss">
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.container {
  width: 100%;
  margin: 0 auto;
  padding: 0;
  background-color: #fff;
  min-height: 100vh;
}

/* 头部样式 */
.header {
  background: linear-gradient(135deg, #e53935, #f44336);
  color: white;
  text-align: center;
  padding: 20px 0;
  position: relative;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.subtitle {
  font-size: 18px;
  margin-top: 5px;
}

/* 内容区样式 */
.content {
  padding: 15px;
  width: 100%;
  max-width: 100%;
}

/* 滚动动画 */
@keyframes scroll-participants {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

@keyframes scroll-orders {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

/* 底部支付按钮 */
.fixed-bottom-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -3px 15px rgba(0, 0, 0, 0.1);
  padding: 12px 20px;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 添加媒体查询，适应不同屏幕尺寸 */
@media (min-width: 768px) {
  .container {
    max-width: 90%;
  }
  
  .content {
    padding: 20px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}
</style> 