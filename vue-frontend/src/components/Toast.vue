<template>
  <div class="toast-container" v-if="isVisible">
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
    // 监听错误提示事件的显示和隐藏
    window.addEventListener('error-toast-show', this.handleErrorToastShow);
    window.addEventListener('error-toast-hide', this.handleErrorToastHide);
    
    console.log('Toast组件已挂载');
  },
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('error-toast-show', this.handleErrorToastShow);
    window.removeEventListener('error-toast-hide', this.handleErrorToastHide);
    
    // 清除超时
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },
  methods: {
    // 响应ErrorToast显示事件
    handleErrorToastShow(event) {
      // 当ErrorToast显示时，隐藏Toast
      this.hide();
    },
    
    // 响应ErrorToast隐藏事件
    handleErrorToastHide(event) {
      // ErrorToast已隐藏，可以继续显示Toast
    },
    
    show(message, duration = 3000, type = 'default') {
      console.log('显示Toast消息:', message, type);
      
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
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: block;
  z-index: 10000;
  pointer-events: none;
}

.toast-message {
  width: auto;
  min-width: 180px;
  max-width: 300px;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  color: #333333;
  padding: 8px 10px;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  text-align: left;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 500;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.03);
  pointer-events: auto;
  margin: 0 auto;
}

.toast-message::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
}

.toast-message.with-icon {
  padding-left: 16px;
}

.toast-message__icon {
  margin-right: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
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
  background-color: rgba(46, 204, 113, 0.08);
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
  background-color: rgba(231, 76, 60, 0.08);
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
  background-color: rgba(243, 156, 18, 0.08);
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
  background-color: rgba(52, 152, 219, 0.08);
}

/* 动画效果 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.35s ease;
}

.toast-fade-enter-from {
  transform: translateX(50px);
  opacity: 0;
}

.toast-fade-leave-to {
  transform: translateX(50px);
  opacity: 0;
}

@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
  }
  
  .toast-message {
    min-width: 0; 
    max-width: 260px;
    width: calc(100% - 20px);
    padding: 7px 9px;
    border-radius: 6px;
    font-size: 11px;
    line-height: 1.3;
  }
  
  .toast-message__icon {
    width: 22px;
    height: 22px;
    font-size: 12px;
    margin-right: 7px;
  }
}
</style> 