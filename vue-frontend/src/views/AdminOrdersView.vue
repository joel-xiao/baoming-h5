<template>
  <div class="admin-orders-view">
    <h1>支付订单管理</h1>
    
    <div class="page-actions">
      <div class="filters">
        <div class="filter">
          <label for="status-filter">支付状态:</label>
          <select id="status-filter" v-model="filters.status" @change="fetchOrders">
            <option value="">全部</option>
            <option value="success">支付成功</option>
            <option value="pending">待支付</option>
            <option value="failed">支付失败</option>
          </select>
        </div>
        
        <div class="filter">
          <label>每页显示：</label>
          <select v-model="pageSize" @change="fetchOrders">
            <option value="10">10条</option>
            <option value="20">20条</option>
            <option value="50">50条</option>
          </select>
        </div>
      </div>
      
      <div class="actions">
        <button class="refresh-btn" @click="fetchOrders" :disabled="isLoading">
          <span class="refresh-icon"></span>
          <span>刷新</span>
        </button>
        
        <button class="export-btn" @click="exportData" :disabled="isExporting">
          <span class="export-icon"></span>
          <span>导出数据</span>
        </button>
      </div>
    </div>
    
    <!-- 错误信息显示 -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="fetchOrders">重试</button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-indicator">
      <p>加载中，请稍候...</p>
    </div>
    
    <!-- 数据统计 -->
    <div class="stats-panel" v-if="stats">
      <div class="stat-item">
        <div class="stat-value">{{ stats.totalCount }}</div>
        <div class="stat-label">总报名人数</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ stats.teamLeaderCount }}</div>
        <div class="stat-label">领队数量</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ stats.teamMemberCount }}</div>
        <div class="stat-label">队员数量</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">¥{{ stats.totalAmount }}</div>
        <div class="stat-label">总收入</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ stats.todayCount }}</div>
        <div class="stat-label">今日报名</div>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>角色</th>
            <th>金额</th>
            <th>支付状态</th>
            <th>支付时间</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order._id">
            <td class="order-no">{{ order.orderNo }}</td>
            <td>{{ order.name }}</td>
            <td>{{ order.phone }}</td>
            <td>{{ order.isTeamLeader ? '领队' : '队员' }}</td>
            <td class="amount">¥{{ order.paymentAmount }}</td>
            <td>
              <span class="status-badge" :class="order.paymentStatus">
                {{ getStatusText(order.paymentStatus) }}
              </span>
            </td>
            <td>{{ formatDate(order.paymentTime) }}</td>
            <td>{{ formatDate(order.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- 空数据提示 -->
      <div class="empty-data" v-if="orders.length === 0 && !isLoading">
        没有找到符合条件的数据
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="pageInfo.total > 0">
      <button 
        class="page-btn" 
        :disabled="pageInfo.current === 1" 
        @click="changePage(pageInfo.current - 1)"
      >
        上一页
      </button>
      
      <div class="page-info">
        {{ pageInfo.current }} / {{ pageInfo.pages }}
      </div>
      
      <button 
        class="page-btn" 
        :disabled="pageInfo.current === pageInfo.pages" 
        @click="changePage(pageInfo.current + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '../api'

export default {
  name: 'AdminOrdersView',
  setup() {
    // 数据
    const orders = ref([])
    const stats = ref(null)
    const isLoading = ref(false)
    const isExporting = ref(false)
    const errorMessage = ref('')
    
    // 分页信息
    const pageInfo = reactive({
      current: 1,
      pages: 1,
      total: 0
    })
    
    // 每页显示数量
    const pageSize = ref(10)
    
    // 筛选条件
    const filters = reactive({
      status: ''
    })
    
    // 获取订单数据
    const fetchOrders = async () => {
      try {
        isLoading.value = true
        errorMessage.value = '' // 清除之前的错误信息
        
        // 构建查询参数
        const params = {
          page: pageInfo.current,
          limit: pageSize.value
        }
        
        if (filters.status) {
          params.status = filters.status
        }
        
        console.log('正在请求订单数据:', params)
        
        // 调用API获取订单数据
        const response = await adminApi.getPaymentOrders(params)
        console.log('订单数据响应:', response)
        
        // 检查响应格式和内容
        if (!response) {
          throw new Error('未收到服务器响应')
        }
        
        if (response.success) {
          if (!response.data || !response.data.orders) {
            console.warn('响应格式不正确:', response)
            errorMessage.value = '服务器返回了错误的数据格式'
            return
          }
          
          // 保存订单数据
          orders.value = response.data.orders
          
          // 检查并设置分页信息
          if (response.data.pagination) {
            pageInfo.current = response.data.pagination.page || 1
            pageInfo.pages = response.data.pagination.pages || 1
            pageInfo.total = response.data.pagination.total || 0
          } else {
            console.warn('响应中缺少分页信息')
            pageInfo.current = 1
            pageInfo.pages = 1
            pageInfo.total = response.data.orders.length
          }
          
          // 尝试获取统计数据
          try {
            await fetchStats()
          } catch (statsError) {
            console.error('获取统计数据失败，但不影响订单显示:', statsError)
          }
        } else {
          // 显示错误信息
          errorMessage.value = response.message || '获取订单数据失败'
          console.error('获取订单失败:', response)
        }
      } catch (error) {
        console.error('获取订单数据错误:', error)
        errorMessage.value = error.message || '系统发生错误，请稍后再试'
      } finally {
        isLoading.value = false
      }
    }
    
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const response = await adminApi.getStats()
        
        if (response.success) {
          stats.value = response.data
        }
      } catch (error) {
        console.error('获取统计数据错误:', error)
      }
    }
    
    // 导出数据
    const exportData = async () => {
      try {
        isExporting.value = true
        
        // 构建导出参数
        const params = {}
        
        if (filters.status) {
          params.status = filters.status
        }
        
        // 调用导出API
        const response = await adminApi.exportRegistrations(params)
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response], { type: 'text/csv' }))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `报名数据_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
      } catch (error) {
        console.error('导出数据错误:', error)
        alert('导出数据失败，请重试')
      } finally {
        isExporting.value = false
      }
    }
    
    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > pageInfo.pages) return
      
      pageInfo.current = page
      fetchOrders()
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '—'
      
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
    
    // 获取支付状态文本
    const getStatusText = (status) => {
      switch(status) {
        case 'success': return '支付成功'
        case 'pending': return '待支付'
        case 'failed': return '支付失败'
        default: return '未知状态'
      }
    }
    
    // 初始化
    onMounted(() => {
      fetchOrders()
    })
    
    return {
      orders,
      stats,
      isLoading,
      isExporting,
      pageInfo,
      pageSize,
      filters,
      fetchOrders,
      exportData,
      changePage,
      formatDate,
      getStatusText,
      errorMessage
    }
  }
}
</script>

<style scoped>
.admin-orders-view {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.page-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 15px;
}

.filter {
  display: flex;
  align-items: center;
}

.filter label {
  margin-right: 5px;
  font-size: 14px;
  color: #666;
}

.filter select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.actions {
  display: flex;
  gap: 10px;
}

.refresh-btn, .export-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.refresh-btn:hover, .export-btn:hover {
  background-color: #f0f0f0;
}

.refresh-btn:disabled, .export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon, .export-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
}

.refresh-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>');
}

.export-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>');
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stats-panel {
  display: flex;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-right: 1px solid #eee;
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #0078d7;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.data-table {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: auto;
  position: relative;
  min-height: 200px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f5f5f5;
}

th {
  padding: 12px 15px;
  text-align: left;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.order-no {
  font-family: monospace;
  font-size: 13px;
}

.amount {
  font-weight: 500;
  color: #ff6b00;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.pending {
  background-color: #fff8e1;
  color: #f57c00;
}

.status-badge.failed {
  background-color: #ffebee;
  color: #c62828;
}

.empty-data {
  padding: 50px 0;
  text-align: center;
  color: #999;
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0078d7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.error-message {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #ffebee;
  border: 1px solid #c62828;
  border-radius: 4px;
  text-align: center;
}

.error-message button {
  padding: 8px 12px;
  border: 1px solid #c62828;
  border-radius: 4px;
  background-color: #c62828;
  color: #fff;
  cursor: pointer;
}

.error-message button:hover {
  background-color: #b71c1c;
}

.loading-indicator {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #0078d7;
  border-radius: 4px;
  text-align: center;
}
</style> 