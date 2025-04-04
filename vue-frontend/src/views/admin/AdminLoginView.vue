<template>
  <div class="login-container">
    <div class="login-card">
      <h2>管理员登录</h2>
      <div class="form-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          placeholder="请输入用户名"
          @keyup.enter="login"
        >
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          placeholder="请输入密码"
          @keyup.enter="login"
        >
      </div>
      <div class="form-group">
        <label for="auth-code">授权码</label>
        <input 
          type="password" 
          id="auth-code" 
          v-model="authCode" 
          placeholder="请输入授权码"
          @keyup.enter="login"
        >
      </div>
      <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
      <button class="login-btn" @click="login" :disabled="isLoading">
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
      <div class="back-link">
        <a href="javascript:void(0)" @click="goBack">返回首页</a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AdminLoginView',
  setup() {
    const router = useRouter()
    const username = ref('')
    const password = ref('')
    const authCode = ref('')
    const errorMsg = ref('')
    const isLoading = ref(false)
    
    // 固定的管理员账号和密码
    const ADMIN_USERNAME = 'admin'
    const ADMIN_PASSWORD = 'admin123'
    const ADMIN_AUTH_CODE = 'wudao2025' // 设置一个授权码，增加安全性
    
    // 检查是否已经登录
    onMounted(() => {
      const isAdmin = localStorage.getItem('isAdmin') === 'true'
      if (isAdmin) {
        // 已登录，直接进入管理页面
        router.push('/admin/orders')
      }
    })
    
    const login = () => {
      // 清除错误信息
      errorMsg.value = ''
      
      // 表单验证
      if (!username.value || !password.value) {
        errorMsg.value = '请输入用户名和密码'
        return
      }
      
      if (!authCode.value) {
        errorMsg.value = '请输入授权码'
        return
      }
      
      isLoading.value = true
      
      // 模拟登录过程
      setTimeout(() => {
        if (username.value === ADMIN_USERNAME && 
            password.value === ADMIN_PASSWORD && 
            authCode.value === ADMIN_AUTH_CODE) {
          // 登录成功
          localStorage.setItem('isAdmin', 'true')
          
          // 记录登录时间，用于会话控制
          localStorage.setItem('adminLoginTime', Date.now().toString())
          
          // 跳转到管理页面
          router.push('/admin/orders')
        } else {
          // 登录失败
          errorMsg.value = '用户名、密码或授权码错误'
        }
        isLoading.value = false
      }, 500)
    }
    
    const goBack = () => {
      router.push('/')
    }
    
    return {
      username,
      password,
      authCode,
      errorMsg,
      isLoading,
      login,
      goBack
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #07c160;
  outline: none;
}

.error-message {
  color: #f56c6c;
  font-size: 14px;
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #06b058;
}

.login-btn:disabled {
  background-color: #95d5b5;
  cursor: not-allowed;
}

.back-link {
  text-align: center;
  margin-top: 16px;
}

.back-link a {
  color: #409eff;
  text-decoration: none;
}

.back-link a:hover {
  text-decoration: underline;
}
</style> 