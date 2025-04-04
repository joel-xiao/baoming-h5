<template>
  <div class="toast-container" v-if="isVisible && !isApiErrorVisible">
    <transition name="toast-fade">
      <div class="toast-message" :class="[type, {'with-icon': showIcon}]">
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
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  pointer-events: none;
  width: 90%;
  max-width: 420px;
}

.toast-message {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  color: #333333;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  text-align: left;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 500;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.toast-message::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.toast-message.with-icon {
  padding-left: 16px;
}

.toast-message__icon {
  margin-right: 14px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.toast-message__content {
  flex: 1;
  word-break: break-word;
}

.toast-message.success {
  background-color: #f2fcf6;
  color: #1e8a5e;
}

.toast-message.success::before {
  background-color: #2ecc71;
}

.toast-message.success .toast-message__icon {
  color: #2ecc71;
  background-color: rgba(46, 204, 113, 0.1);
}

.toast-message.error {
  background-color: #fef5f5;
  color: #b83a38;
}

.toast-message.error::before {
  background-color: #e74c3c;
}

.toast-message.error .toast-message__icon {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.toast-message.warning {
  background-color: #fef9ef;
  color: #af7010;
}

.toast-message.warning::before {
  background-color: #f39c12;
}

.toast-message.warning .toast-message__icon {
  color: #f39c12;
  background-color: rgba(243, 156, 18, 0.1);
}

.toast-message.default {
  background-color: #f5f9ff;
  color: #3273dc;
}

.toast-message.default::before {
  background-color: #3498db;
}

.toast-message.default .toast-message__icon {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-fade-enter-from {
  transform: translateY(30px) translateX(-50%);
  opacity: 0;
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) translateX(-50%);
}

@media (max-width: 768px) {
  .toast-container {
    bottom: 30px;
    width: 92%;
    max-width: 360px;
  }
  
  .toast-message {
    padding: 14px 18px;
    font-size: 14px;
  }
  
  .toast-message__icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
    margin-right: 12px;
  }
}
</style> 