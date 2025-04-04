<template>
  <div class="toast-container" v-if="isVisible && !isApiErrorVisible">
    <transition name="toast-fade">
      <div class="toast-message" :class="type">
        <div class="toast-message__icon" v-if="showIcon">
          <i class="fas" :class="iconClass"></i>
        </div>
        <div class="toast-message__content">{{ message }}</div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'MessageToast',
  data() {
    return {
      isVisible: false,
      isApiErrorVisible: false,
      message: '',
      type: 'default',
      timeout: null
    }
  },
  computed: {
    // 根据类型确定图标
    iconClass() {
      const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-times-circle',
        'warning': 'fa-exclamation-triangle',
        'default': 'fa-info-circle'
      };
      return icons[this.type] || icons.default;
    },
    // 是否显示图标
    showIcon() {
      return this.type !== 'default';
    }
  },
  mounted() {
    // 监听API错误事件，当API错误显示时，隐藏Toast
    window.addEventListener('api-error', this.handleApiError);
    window.addEventListener('auth-error', this.handleApiError);
    
    // 添加对新增事件的监听
    window.addEventListener('api-toast-show', this.handleApiError);
    window.addEventListener('api-toast-hide', this.handleApiToastHide);
  },
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('api-error', this.handleApiError);
    window.removeEventListener('auth-error', this.handleApiError);
    window.removeEventListener('api-toast-show', this.handleApiError);
    window.removeEventListener('api-toast-hide', this.handleApiToastHide);
    
    // 清除超时
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },
  methods: {
    handleApiError() {
      // 记录API错误正在显示
      this.isApiErrorVisible = true;
      // 隐藏当前的Toast
      this.isVisible = false;
      
      // 5秒后恢复状态
      setTimeout(() => {
        this.isApiErrorVisible = false;
      }, 5000);
    },
    
    // 响应ApiErrorHandler隐藏事件
    handleApiToastHide() {
      this.isApiErrorVisible = false;
    },
    
    show(message, duration = 3000, type = 'default') {
      // 如果当前API错误正在显示，则不显示Toast
      if (this.isApiErrorVisible) return;
      
      // 清除之前的计时器
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      // 设置消息、类型并显示
      this.message = message;
      this.type = type;
      this.isVisible = true;
      
      // 设置自动隐藏
      this.timeout = setTimeout(() => {
        this.hide();
      }, duration);
    },
    
    hide() {
      this.isVisible = false;
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  pointer-events: none;
}

.toast-message {
  display: flex;
  align-items: center;
  background-color: rgba(33, 33, 33, 0.85);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  max-width: 400px;
  min-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  text-align: center;
  font-size: 15px;
  line-height: 1.4;
}

.toast-message__icon {
  margin-right: 12px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-message__content {
  flex: 1;
}

.toast-message.success {
  background-color: rgba(46, 204, 113, 0.9);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}

.toast-message.error {
  background-color: rgba(231, 76, 60, 0.9);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.toast-message.warning {
  background-color: rgba(243, 156, 18, 0.9);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  transform: translateY(30px);
  opacity: 0;
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

@media (max-width: 768px) {
  .toast-container {
    width: 90%;
    max-width: 400px;
  }

  .toast-message {
    width: 100%;
    max-width: none;
    min-width: 0;
  }
}
</style> 