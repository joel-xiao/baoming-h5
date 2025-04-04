<template>
  <div class="error-toast-container">
    <!-- 统一错误提示框 -->
    <transition name="error-toast-fade">
      <div 
        v-if="showError" 
        :class="['error-toast', `error-toast--${errorType}`]"
      >
        <span class="error-toast__icon">
          <i class="fas" :class="errorIcon"></i>
        </span>
        <div class="error-toast__content">
          <div class="error-toast__title">{{ errorTitle }}</div>
          <div class="error-toast__message">
            {{ errorMessage }}
            <div class="error-hint" v-if="errorMessage.includes('服务器时间')">
              请检查网络连接后刷新页面重试。
            </div>
            <div class="error-hint" v-else-if="errorMessage.includes('活动已结束')">
              报名通道已关闭，感谢您的关注。
            </div>
          </div>
        </div>
        <button class="error-toast__close" @click="hideError">×</button>
      </div>
    </transition>
  </div>
</template>

<script>
import { HTTP_STATUS } from '../api/core/errorHandler';

export default {
  name: 'ErrorToast',
  
  data() {
    return {
      showError: false,
      errorType: 'error', // 默认错误类型
      errorTitle: '错误',
      errorMessage: '',
      errorStatus: null,
      errorDetails: null,
      timeoutId: null
    };
  },
  
  computed: {
    errorIcon() {
      const icons = {
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        auth: 'fa-lock',
        network: 'fa-wifi'
      };
      
      return icons[this.errorType] || icons.error;
    }
  },
  
  mounted() {
    // 监听API错误事件
    window.addEventListener('api-error', this.handleApiError);
    
    // 监听认证错误事件
    window.addEventListener('auth-error', this.handleAuthError);
  },
  
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('api-error', this.handleApiError);
    window.removeEventListener('auth-error', this.handleAuthError);
    
    // 清除超时
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  },
  
  methods: {
    handleApiError(event) {
      const { status, message, errors, errorType } = event.detail;
      
      // 使用外部传入的错误类型，如果有的话
      if (errorType) {
        this.errorType = errorType;
      } else {
        // 设置错误类型
        switch (status) {
          case HTTP_STATUS.BAD_REQUEST:
            this.errorType = 'warning';
            this.errorTitle = '请求错误';
            break;
            
          case HTTP_STATUS.FORBIDDEN:
            this.errorType = 'warning';
            this.errorTitle = '权限错误';
            break;
            
          case HTTP_STATUS.NOT_FOUND:
            this.errorType = 'warning';
            this.errorTitle = '资源不存在';
            break;
            
          case HTTP_STATUS.INTERNAL_ERROR:
            this.errorType = 'error';
            this.errorTitle = '服务器错误';
            break;
            
          case 0: // 网络错误或请求错误
            this.errorType = 'network';
            this.errorTitle = '网络错误';
            break;
            
          default:
            this.errorType = 'error';
            this.errorTitle = `错误 (${status})`;
        }
      }
      
      this.errorMessage = message;
      this.errorStatus = status;
      this.errorDetails = errors;
      
      this.showErrorToast();
    },
    
    handleAuthError(event) {
      const { message, errorType } = event.detail;
      
      // 使用外部传入的错误类型，如果有的话
      this.errorType = errorType || 'auth';
      this.errorTitle = '认证错误';
      this.errorMessage = message;
      this.errorStatus = HTTP_STATUS.UNAUTHORIZED;
      
      this.showErrorToast();
      
      // 认证错误通常需要跳转到登录页
      // 如果使用Vue Router，可以在这里导航到登录页
      if (this.$router) {
        // 保存当前路径，用于登录后重定向
        const currentPath = this.$route.fullPath;
        localStorage.setItem('redirect_after_login', currentPath);
        
        // 短暂延迟后跳转，让用户看到错误信息
        setTimeout(() => {
          this.$router.push({ 
            path: '/login', 
            query: { redirect: 'session_expired' } 
          });
        }, 1500);
      }
    },
    
    showErrorToast() {
      // 显示错误提示
      this.showError = true;
      
      // 发送自定义事件，通知其他组件（如Toast）错误提示正在显示
      const apiShowEvent = new CustomEvent('error-toast-show', {
        detail: { showing: true }
      });
      window.dispatchEvent(apiShowEvent);
      
      // 清除之前的超时
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      // 设置5秒后自动隐藏
      this.timeoutId = setTimeout(() => {
        this.hideError();
      }, 5000);
    },
    
    hideError() {
      this.showError = false;
      
      // 发送自定义事件，通知其他组件错误提示已隐藏
      const apiHideEvent = new CustomEvent('error-toast-hide', {
        detail: { showing: false }
      });
      window.dispatchEvent(apiHideEvent);
    }
  }
};
</script>

<style>
.error-toast-container {
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 0;
  z-index: 9999;
}

/* 统一错误提示框样式 */
.error-toast {
  position: fixed !important;
  top: 40px !important;
  right: 20px !important;
  left: auto !important; /* 确保不会被左侧定位覆盖 */
  width: auto;
  min-width: 180px;
  max-width: 300px;
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  z-index: 9999;
  background-color: #fff;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.03);
  pointer-events: auto;
  transform: translateZ(0);
}

.error-toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
}

.error-hint {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 4px;
  font-weight: 400;
}

/* 错误类型样式 */
.error-toast--error {
  background-color: #fef5f5;
}
.error-toast--error .error-toast__title { color: #b83a38; }
.error-toast--error::before { background-color: #e74c3c; }
.error-toast--error .error-toast__icon {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.08);
}

.error-toast--warning {
  background-color: #fef9ef;
}
.error-toast--warning .error-toast__title { color: #af7010; }
.error-toast--warning::before { background-color: #f39c12; }
.error-toast--warning .error-toast__icon {
  color: #f39c12;
  background-color: rgba(243, 156, 18, 0.08);
}

.error-toast--auth {
  background-color: #f5f9ff;
}
.error-toast--auth .error-toast__title { color: #3273dc; }
.error-toast--auth::before { background-color: #3498db; }
.error-toast--auth .error-toast__icon {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.08);
}

.error-toast--network {
  background-color: #f9f4fe;
}
.error-toast--network .error-toast__title { color: #8e44ad; }
.error-toast--network::before { background-color: #9b59b6; }
.error-toast--network .error-toast__icon {
  color: #9b59b6;
  background-color: rgba(155, 89, 182, 0.08);
}

.error-toast--center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.error-toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 14px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.error-toast__content {
  flex: 1;
  min-width: 0;
}

.error-toast__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
  color: #333;
}

.error-toast__message {
  font-size: 12px;
  line-height: 1.3;
  color: #666;
  word-break: break-word;
}

.error-toast__close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  margin-left: 8px;
  padding: 0 6px;
  transition: color 0.2s;
  margin-top: -2px;
  line-height: 1;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.error-toast__close:hover {
  color: #333;
  opacity: 1;
}

/* 动画效果 */
.error-toast-fade-enter-active {
  animation: slide-in-right 0.35s ease-out forwards;
}

.error-toast-fade-leave-active {
  animation: slide-out-right 0.35s ease-in forwards;
}

@keyframes slide-in-right {
  0% {
    opacity: 0;
    transform: translateX(50px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-out-right {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(50px);
  }
}

@media (max-width: 768px) {
  .error-toast {
    top: 10px !important;
    right: 10px !important;
    left: auto !important;
    min-width: 0;
    max-width: 260px;
    width: calc(100% - 20px);
    padding: 7px 9px;
    border-radius: 6px;
  }
  
  .error-toast__icon {
    width: 22px;
    height: 22px;
    font-size: 12px;
    margin-right: 7px;
  }
  
  .error-toast__title {
    font-size: 12px;
    margin-bottom: 1px;
  }
  
  .error-toast__message {
    font-size: 11px;
    line-height: 1.3;
  }

  .error-hint {
    font-size: 11px;
    margin-top: 3px;
  }

  .error-toast__close {
    font-size: 14px;
    margin-left: 4px;
    padding: 0 4px;
    height: 18px;
  }
}
</style> 