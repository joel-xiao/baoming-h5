<template>
  <div class="admin-orders-view">
    <h1>支付订单管理</h1>
    
    <div class="page-actions">
      <div class="filters">
        <div class="filter">
          <label for="status-filter">支付状态:</label>
          <select id="status-filter" v-model="ordersApi.filters.status" @change="onStatusChange">
            <option value="">全部</option>
            <option value="success">支付成功</option>
            <option value="pending">待支付</option>
            <option value="failed">支付失败</option>
          </select>
        </div>
        
        <div class="filter">
          <label>每页显示：</label>
          <select v-model="pageSize" @change="onPageSizeChange">
            <option :value="10">10条</option>
            <option :value="20">20条</option>
            <option :value="50">50条</option>
          </select>
        </div>
      </div>
      
      <div class="actions">
        <button class="refresh-btn" @click="ordersApi.loadData()" :disabled="ordersApi.loading">
          <span class="refresh-icon"></span>
          <span>{{ ordersApi.loading ? '加载中...' : '刷新' }}</span>
        </button>
        
        <button class="export-btn" @click="exportData" :disabled="isExporting">
          <span class="export-icon"></span>
          <span>{{ isExporting ? '导出中...' : '导出数据' }}</span>
        </button>
      </div>
    </div>
    
    <!-- 错误信息显示 -->
    <div v-if="ordersApi.error" class="error-message">
      <p>{{ ordersApi.error.message }}</p>
      <button @click="ordersApi.loadData()">重试</button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="ordersApi.loading && !ordersApi.items.length" class="loading-indicator">
      <p>加载中，请稍候...</p>
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
          <tr v-for="order in ordersApi.items" :key="order._id">
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
      <div class="empty-data" v-if="ordersApi.items.length === 0 && !ordersApi.loading">
        没有找到符合条件的数据
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="ordersApi.totalItems > 0">
      <button 
        class="page-btn" 
        :disabled="ordersApi.page === 1" 
        @click="ordersApi.goToPage(ordersApi.page - 1)"
      >
        上一页
      </button>
      
      <div class="page-info">
        {{ ordersApi.page }} / {{ ordersApi.totalPages }}
      </div>
      
      <button 
        class="page-btn" 
        :disabled="ordersApi.page === ordersApi.totalPages" 
        @click="ordersApi.goToPage(ordersApi.page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { adminApi } from '@api'
import { usePagination, useApi } from '@api/hooks/useApi'

export default {
  name: 'AdminOrdersView',
  setup() {
    // 每页显示数量
    const pageSize = ref(10)
    
    // 使用分页API Hook
    const ordersApi = usePagination(adminApi.getRegistrations, {
      pageSize: pageSize.value,
      immediate: true,
      initialFilters: {
        status: ''
      }
    });
    
    // 统计数据API Hook
    const statsApi = useApi(adminApi.getCachedStats, {
      immediate: true
    });
    
    // 状态变量
    const isExporting = ref(false);
    
    // 页面大小变化处理
    const onPageSizeChange = () => {
      ordersApi.loadData();
    };
    
    // 状态筛选变化处理
    const onStatusChange = () => {
      ordersApi.goToPage(1); // 切换到第一页
    };
    
    // 导出数据
    const exportData = async () => {
      if (isExporting.value) return;
      
      try {
        isExporting.value = true;
        
        // 导出当前筛选条件的数据
        const result = await adminApi.exportData({
          status: ordersApi.filters.status,
          format: 'excel'
        });
        
        // 处理下载逻辑
        if (result instanceof Blob) {
          const url = window.URL.createObjectURL(result);
          const a = document.createElement('a');
          a.href = url;
          a.download = `报名数据_${new Date().toISOString().slice(0,10)}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error('导出数据格式错误');
        }
      } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出数据失败，请重试');
      } finally {
        isExporting.value = false;
      }
    };
    
    // 监听页面大小变化
    watch(pageSize, (newSize) => {
      ordersApi.loadData();
    });
    
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
    
    return {
      ordersApi,
      statsApi,
      pageSize,
      isExporting,
      exportData,
      formatDate,
      getStatusText,
      onStatusChange,
      onPageSizeChange
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