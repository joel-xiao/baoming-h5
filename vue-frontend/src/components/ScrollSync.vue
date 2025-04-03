<template>
  <div class="scroll-sync-container">
    <!-- 这是一个用于同步其他组件滚动的空组件 -->
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref } from 'vue'

export default {
  name: 'ScrollSync',
  setup() {
    // 保存当前注册的滚动组件
    const scrollContainers = ref([])
    
    // 通过全局事件总线发布滚动同步信号
    const syncScrolling = () => {
      // 使用全局事件来同步滚动
      document.dispatchEvent(new CustomEvent('sync-scroll-pulse', {
        detail: { timestamp: Date.now() }
      }))
    }
    
    // 每10秒发送一次同步信号（从原来的30秒改为10秒，加快滚动速度）
    let intervalId = null
    
    const startSync = () => {
      // 立即发送一次
      syncScrolling()
      
      // 设置定时器
      intervalId = setInterval(syncScrolling, 10000)
    }
    
    // 添加全局注册滚动组件的方法
    const registerScrollContainer = (id, container) => {
      // 如果已存在，先移除
      scrollContainers.value = scrollContainers.value.filter(item => item.id !== id)
      
      // 添加到注册列表
      scrollContainers.value.push({
        id,
        container,
        resetScroll: () => {
          // 由各自组件负责重置
        }
      })
      
      return () => {
        // 返回注销函数
        scrollContainers.value = scrollContainers.value.filter(item => item.id !== id)
      }
    }
    
    // 添加全局方法
    if (!window.scrollUtils) {
      window.scrollUtils = {
        registerScrollContainer,
        syncAll: syncScrolling
      }
    }
    
    onMounted(() => {
      startSync()
    })
    
    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      
      // 清除全局引用
      if (window.scrollUtils) {
        window.scrollUtils = null
      }
    })
    
    return {}
  }
}
</script>

<style scoped>
.scroll-sync-container {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}
</style> 