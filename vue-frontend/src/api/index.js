/**
 * API请求封装
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

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加请求头等配置
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

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
    return Promise.reject(error);
  }
);

// 报名相关接口
export const registrationApi = {
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

// 支付相关接口
export const paymentApi = {
  // 创建支付订单
  createPayment(data) {
    return api.post('/payment/create', data);
  },
  
  // 查询支付状态
  getPaymentStatus(orderNo) {
    return api.get(`/payment/status/${orderNo}`);
  }
};

// 管理员接口
export const adminApi = {
  // 获取所有支付订单
  async getPaymentOrders(params) {
    try {
      console.log('请求支付订单列表，参数:', params);
      const response = await api.get('/payment/admin/orders', { params });
      console.log('订单列表响应:', response);
      return response;
    } catch (error) {
      console.error('获取支付订单列表失败:', error);
      // 更详细的错误信息
      if (error.response) {
        // 服务器返回了错误状态码
        console.error('服务器错误信息:', {
          status: error.response.status,
          data: error.response.data
        });
        // 对于500错误，返回友好的错误信息
        if (error.response.status === 500) {
          return { 
            success: false, 
            message: '服务器内部错误，请稍后再试',
            error: error.response.data
          };
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('未收到服务器响应');
        return { 
          success: false, 
          message: '网络请求超时，请检查网络连接'
        };
      }
      
      // 默认返回一个一般性错误
      return { 
        success: false, 
        message: error.message || '获取订单数据失败'
      };
    }
  },
  
  // 获取所有报名记录
  getRegistrations(params) {
    return api.get('/admin/registrations', { params });
  },
  
  // 获取报名统计数据
  getStats() {
    return api.get('/admin/stats', {
      params: {
        _t: Date.now() // 添加时间戳防止缓存
      }
    });
  },
  
  // 记录浏览量
  recordView() {
    return api.post('/admin/record-view');
  },
  
  // 导出报名数据
  exportRegistrations(params) {
    return api.get('/admin/export', { 
      params,
      responseType: 'blob' // 将响应设为二进制数据流
    });
  }
};

export default {
  registrationApi,
  paymentApi,
  adminApi
}; 