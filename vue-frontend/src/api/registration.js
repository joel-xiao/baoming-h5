/**
 * 报名相关API封装
 */
import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 统一处理错误
    let errorMessage = '服务器连接失败';
    if (error.response) {
      const { status, data } = error.response;
      errorMessage = data.message || `请求错误 (${status})`;
    }
    console.error('API请求错误:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

const registrationApi = {
  // 获取报名记录
  getRegistrations() {
    return api.get('/registration');
  },
  
  // 创建队长报名
  createTeamLeader(data) {
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
};

export default registrationApi; 