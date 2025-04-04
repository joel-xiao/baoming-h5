<template>
  <div class="api-error-handler">
    <transition name="api-error-fade">
      <div 
        v-if="showError" 
        :class="['api-error-toast', `api-error-toast--${errorType}`]"
      >
        <span class="api-error-toast__icon">
          <i class="fas" :class="errorIcon"></i>
        </span>
        <div class="api-error-toast__content">
          <div class="api-error-toast__title">{{ errorTitle }}</div>
          <div class="api-error-toast__message">{{ errorMessage }}</div>
        </div>
        <button class="api-error-toast__close" @click="hideError">×</button>
      </div>
    </transition>
  </div>
</template>

<script>
import { HTTP_STATUS } from '../api/core/errorHandler';

export default {
  name: 'ApiErrorHandler',
  
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
      
      // 发送自定义事件，通知其他组件（如Toast）API错误正在显示
      const apiShowEvent = new CustomEvent('api-toast-show', {
        detail: { showing: true }
      });
      window.dispatchEvent(apiShowEvent);
      
      // 清除之前的超时
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      // 5秒后自动隐藏
      this.timeoutId = setTimeout(() => {
        this.hideError();
      }, 5000);
    },
    
    hideError() {
      this.showError = false;
      
      // 发送自定义事件，通知其他组件API错误已隐藏
      const apiHideEvent = new CustomEvent('api-toast-hide', {
        detail: { showing: false }
      });
      window.dispatchEvent(apiHideEvent);
    }
  }
};
</script>

<style scoped>
.api-error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 320px;
  max-width: 450px;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: flex-start;
  z-index: 9999;
  background-color: #fff;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.api-error-toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.api-error-toast--error {
  background-color: #fef5f5;
}

.api-error-toast--error .api-error-toast__title {
  color: #b83a38;
}

.api-error-toast--error::before {
  background-color: #e74c3c;
}

.api-error-toast--warning {
  background-color: #fef9ef;
}

.api-error-toast--warning .api-error-toast__title {
  color: #af7010;
}

.api-error-toast--warning::before {
  background-color: #f39c12;
}

.api-error-toast--auth {
  background-color: #f5f9ff;
}

.api-error-toast--auth .api-error-toast__title {
  color: #3273dc;
}

.api-error-toast--auth::before {
  background-color: #3498db;
}

.api-error-toast--network {
  background-color: #f9f4fe;
}

.api-error-toast--network .api-error-toast__title {
  color: #8e44ad;
}

.api-error-toast--network::before {
  background-color: #9b59b6;
}

.api-error-toast--center {
  top: 50%;
  right: auto;
  left: 50%;
  transform: translate(-50%, -50%);
}

.api-error-toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-size: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.api-error-toast--error .api-error-toast__icon {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.api-error-toast--warning .api-error-toast__icon {
  color: #f39c12;
  background-color: rgba(243, 156, 18, 0.1);
}

.api-error-toast--auth .api-error-toast__icon {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

.api-error-toast--network .api-error-toast__icon {
  color: #9b59b6;
  background-color: rgba(155, 89, 182, 0.1);
}

.api-error-toast__content {
  flex: 1;
  min-width: 0;
}

.api-error-toast__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.api-error-toast__message {
  font-size: 14px;
  line-height: 1.5;
  color: #666;
  word-break: break-word;
}

.api-error-toast__close {
  background: none;
  border: none;
  font-size: 22px;
  color: #999;
  cursor: pointer;
  margin-left: 10px;
  padding: 0 6px;
  transition: color 0.2s;
  margin-top: -5px;
  line-height: 1;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.api-error-toast__close:hover {
  color: #333;
  opacity: 1;
}

/* 动画效果 */
.api-error-fade-enter-active,
.api-error-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.api-error-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.api-error-fade-leave-to {
  transform: translateY(-30px);
  opacity: 0;
}

@media (max-width: 768px) {
  .api-error-toast {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    max-width: none;
    padding: 14px;
  }
  
  .api-error-toast__icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
    margin-right: 12px;
  }
  
  .api-error-toast__title {
    font-size: 15px;
    margin-bottom: 4px;
  }
  
  .api-error-toast__message {
    font-size: 13px;
  }
}
</style> 