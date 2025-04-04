/**
 * API Hooks工具 - 用于Vue Composition API
 */
import { ref, reactive } from 'vue';

/**
 * 通用API请求Hook
 * @param {Function} apiFunction - API请求函数
 * @param {Object} options - 配置选项
 * @returns {Object} API请求状态和方法
 */
export const useApi = (apiFunction, options = {}) => {
  const { immediate = false, initialParams = null, onSuccess, onError } = options;
  
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);
  const lastParams = ref(initialParams);
  
  // 执行API请求
  const execute = async (params = null) => {
    try {
      loading.value = true;
      error.value = null;
      lastParams.value = params;
      
      const response = await apiFunction(params);
      
      // 处理成功响应
      if (response && response.success) {
        data.value = response.data || response;
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        // 处理API返回的错误
        error.value = {
          message: response?.message || '请求失败',
          response
        };
        if (onError) {
          onError(error.value);
        }
      }
      
      return response;
    } catch (err) {
      // 处理异常
      error.value = {
        message: err.message || '请求发生异常',
        error: err
      };
      if (onError) {
        onError(error.value);
      }
      
      return {
        success: false,
        message: err.message,
        error: err
      };
    } finally {
      loading.value = false;
    }
  };
  
  // 重置状态
  const reset = () => {
    data.value = null;
    error.value = null;
    loading.value = false;
  };
  
  // 重新执行上一次请求
  const retry = async () => {
    return execute(lastParams.value);
  };
  
  // 如果配置了立即执行
  if (immediate && initialParams !== undefined) {
    execute(initialParams);
  }
  
  return {
    data,
    error,
    loading,
    execute,
    reset,
    retry
  };
};

/**
 * 分页数据Hook
 * @param {Function} apiFunction - API请求函数
 * @param {Object} options - 配置选项
 * @returns {Object} 分页数据状态和方法
 */
export const usePagination = (apiFunction, options = {}) => {
  const { pageSize = 10, immediate = false, initialFilters = {} } = options;
  
  const items = ref([]);
  const error = ref(null);
  const loading = ref(false);
  const page = ref(1);
  const totalItems = ref(0);
  const totalPages = ref(0);
  
  // 分页和过滤数据
  const filters = reactive({
    ...initialFilters
  });
  
  // 构建查询参数
  const buildQueryParams = () => {
    return {
      page: page.value,
      limit: pageSize,
      ...filters
    };
  };
  
  // 加载数据
  const loadData = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      const params = buildQueryParams();
      const response = await apiFunction(params);
      
      if (response && response.success) {
        // 提取分页数据
        const { data, pagination } = response.data || {};
        
        if (Array.isArray(data)) {
          items.value = data;
        } else if (response.data && Array.isArray(response.data.items)) {
          items.value = response.data.items;
        } else if (Array.isArray(response.data)) {
          items.value = response.data;
        } else {
          items.value = [];
        }
        
        // 设置分页信息
        if (pagination) {
          totalItems.value = pagination.total || 0;
          totalPages.value = pagination.pages || 0;
        }
      } else {
        error.value = {
          message: response?.message || '获取数据失败',
          response
        };
      }
      
      return response;
    } catch (err) {
      error.value = {
        message: err.message || '请求发生异常',
        error: err
      };
      
      return {
        success: false,
        message: err.message,
        error: err
      };
    } finally {
      loading.value = false;
    }
  };
  
  // 切换页码
  const goToPage = async (newPage) => {
    if (newPage < 1 || (totalPages.value > 0 && newPage > totalPages.value)) {
      return;
    }
    
    page.value = newPage;
    return loadData();
  };
  
  // 设置过滤器并重新加载
  const setFilters = async (newFilters) => {
    Object.assign(filters, newFilters);
    page.value = 1; // 重置为第一页
    return loadData();
  };
  
  // 重置过滤器
  const resetFilters = async () => {
    Object.keys(filters).forEach(key => {
      filters[key] = initialFilters[key] || '';
    });
    page.value = 1;
    return loadData();
  };
  
  // 如果配置了立即执行
  if (immediate) {
    loadData();
  }
  
  return {
    items,
    loading,
    error,
    page,
    totalItems,
    totalPages,
    filters,
    loadData,
    goToPage,
    setFilters,
    resetFilters
  };
};

export default {
  useApi,
  usePagination
}; 