/**
 * API请求封装
 */
import axios from 'axios';
import config from '../config';

// 创建API实例
const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 在请求头中添加token（如果有）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 处理服务器返回的错误
      console.error('API错误:', error.response.data);
      
      // 如果是401未授权，可能需要重新登录
      if (error.response.status === 401) {
        // 清除token并跳转到登录页
        localStorage.removeItem('token');
        // 使用路由导航到登录页（需在组件中处理）
      }
    } else if (error.request) {
      // 请求发送但没有收到响应
      console.error('网络错误，服务器未响应');
      
      // 如果启用了离线存储，可以在这里切换到离线模式
      if (config.features.offlineStorage) {
        console.log('切换到离线模式');
        // 实现离线存储逻辑
      }
    } else {
      // 请求设置触发的错误
      console.error('请求错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// API方法
const apiService = {
  // 团队报名相关
  registration: {
    // 获取最近报名记录
    getRecent() {
      return api.get('/registration');
    },
    
    // 创建队长报名
    createLeader(data) {
      return api.post('/registration/leader', data);
    },
    
    // 加入团队
    joinTeam(data) {
      return api.post('/registration/join', data);
    },
    
    // 获取团队成员
    getTeamMembers(teamId) {
      return api.get(`/registration/team/${teamId}`);
    }
  },
  
  // 支付相关
  payment: {
    // 创建支付订单
    createOrder(data) {
      return api.post('/payment/create', data);
    },
    
    // 查询支付状态
    checkStatus(orderNo) {
      return api.get(`/payment/status/${orderNo}`);
    }
  },
  
  // 管理员相关
  admin: {
    // 获取统计数据
    getStats() {
      return api.get('/admin/stats');
    },
    
    // 获取所有报名记录
    getRegistrations(params) {
      return api.get('/admin/registrations', { params });
    },
    
    // 导出数据
    exportData(params) {
      return api.get('/admin/export', { 
        params,
        responseType: 'blob' // 用于下载文件
      });
    }
  }
};

export default apiService; 