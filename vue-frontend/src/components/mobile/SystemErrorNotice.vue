<template>
  <div class="system-error-notice" v-if="hasError">
    <div class="error-content">
      <div class="error-icon">
        <span>!</span>
      </div>
      <div class="error-message">
        {{ errorMessage }}
        <div class="error-hint" v-if="errorMessage.includes('服务器时间')">
          请检查网络连接后刷新页面重试。
        </div>
        <div class="error-hint" v-else-if="errorMessage.includes('活动已结束')">
          报名通道已关闭，感谢您的关注。
        </div>
      </div>
      <div class="error-close" @click="closeError">×</div>
    </div>
  </div>
</template>

<script>
import { useSystem } from '@/store/hooks'

export default {
  name: 'SystemErrorNotice',
  setup() {
    // 使用系统相关的hooks
    const system = useSystem()
    
    const closeError = () => {
      system.clearError()
    }
    
    return {
      hasError: system.hasError,
      errorMessage: system.errorMessage,
      closeError
    }
  }
}
</script>

<style scoped>
.system-error-notice {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #e53935;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.error-content {
  display: flex;
  align-items: center;
  padding: 15px;
  color: white;
  max-width: 100%;
  margin: 0 auto;
}

.error-icon {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
  font-size: 16px;
}

.error-message {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.error-hint {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 4px;
  font-weight: 400;
}

.error-close {
  width: 24px;
  height: 24px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 15px;
  cursor: pointer;
  font-size: 24px;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.error-close:hover {
  opacity: 1;
}
</style> 