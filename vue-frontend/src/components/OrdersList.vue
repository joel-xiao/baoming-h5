<template>
  <div class="order-header">
    <div class="order-title">最新订单记录</div>
  </div>
  <div class="orders-container" ref="ordersContainer">
    <div class="orders-wrapper" ref="ordersWrapper">
      <div class="orders">
        <div class="order-item" v-for="(order, index) in displayOrders" :key="index">
          <div class="order-user">
            <div class="order-avatar">{{ order.name.charAt(0) }}</div>
            <div class="order-info">
              <div class="order-name">{{ order.name }}</div>
              <div class="order-phone">{{ order.phone }}</div>
            </div>
          </div>
          <div class="order-payment">
            <div class="order-status">{{ order.status }} ¥{{ order.amount }}.00元</div>
            <div class="order-time">{{ order.time }}</div>
          </div>
        </div>
      </div>
      <!-- 复制一份内容用于无缝滚动 -->
      <div class="orders" v-if="shouldDuplicate">
        <div class="order-item" v-for="(order, index) in displayOrders" :key="`dup-${index}`">
          <div class="order-user">
            <div class="order-avatar">{{ order.name.charAt(0) }}</div>
            <div class="order-info">
              <div class="order-name">{{ order.name }}</div>
              <div class="order-phone">{{ order.phone }}</div>
            </div>
          </div>
          <div class="order-payment">
            <div class="order-status">{{ order.status }} ¥{{ order.amount }}.00元</div>
            <div class="order-time">{{ order.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useActivity, useRegistration } from '../store/hooks'

export default {
  name: 'OrdersList',
  setup() {
    // 使用模块化hooks
    const activity = useActivity()
    const registration = useRegistration()
    
    const ordersContainer = ref(null)
    const ordersWrapper = ref(null)
    
    // 添加滚动相关状态
    const scrollPosition = ref(0)
    const scrollAnimationId = ref(null)
    const totalHeight = ref(0)
    const containerHeight = ref(0)
    const scrollSpeed = ref(0.8) // 大幅提高滚动速度，从0.3改为0.8
    const shouldScroll = ref(false)
    
    // 使用activity中的orders数据
    const orders = computed(() => activity.orders.value || [])
    
    // 安全的显示订单，确保不会是undefined
    const displayOrders = computed(() => {
      return orders.value || []
    })
    
    // 是否需要复制一份订单列表
    const shouldDuplicate = computed(() => {
      return displayOrders.value.length > 5
    })
    
    // 从API加载订单数据
    const loadOrders = async () => {
      try {
        // 使用registration钩子加载订单数据
        await registration.loadOrders()
      } catch (error) {
        console.error('加载订单数据失败:', error)
      }
    }
    
    // 手机号码脱敏
    const maskPhone = (phone) => {
      if (!phone || phone.length !== 11) return phone
      return phone.substring(0, 3) + '****' + phone.substring(7)
    }
    
    // 格式化日期时间
    const formatDateTime = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // JS实现的滚动动画
    const startScrollAnimation = () => {
      if (scrollAnimationId.value) {
        cancelAnimationFrame(scrollAnimationId.value)
      }
      
      // 测量容器和内容高度
      updateHeights()
      
      // 基于元素高度判断是否需要滚动
      shouldScroll.value = displayOrders.value.length > 5
      
      if (!shouldScroll.value) return
      
      const scrollStep = () => {
        // 增加滚动位置
        scrollPosition.value += scrollSpeed.value
        
        const firstListHeight = totalHeight.value / 2
        
        // 当滚动到第一个列表底部时，重置到顶部
        if (scrollPosition.value >= firstListHeight) {
          scrollPosition.value = 0
        }
        
        // 应用滚动位置
        if (ordersWrapper.value) {
          ordersWrapper.value.style.transform = `translateY(-${scrollPosition.value}px)`
        }
        
        // 继续动画循环
        scrollAnimationId.value = requestAnimationFrame(scrollStep)
      }
      
      // 开始动画
      scrollAnimationId.value = requestAnimationFrame(scrollStep)
    }
    
    // 更新高度测量
    const updateHeights = () => {
      if (ordersWrapper.value && ordersContainer.value) {
        totalHeight.value = ordersWrapper.value.offsetHeight
        containerHeight.value = ordersContainer.value.offsetHeight
        
        // 保持固定滚动速度，不再根据内容高度调整
        scrollSpeed.value = 0.8 // 同步更新为0.8
      }
    }
    
    // 处理同步滚动事件，重置滚动位置
    const handleSyncScroll = () => {
      if (ordersWrapper.value) {
        // 重置滚动位置
        scrollPosition.value = 0
        ordersWrapper.value.style.transform = `translateY(0px)`
      }
    }
    
    // 监控订单数据变化，更新滚动设置
    watch(() => displayOrders.value.length, (newLength) => {
      shouldScroll.value = newLength > 5
      updateHeights()
      
      if (shouldScroll.value && !scrollAnimationId.value) {
        startScrollAnimation()
      }
    })
    
    onMounted(() => {
      // 从API加载订单数据
      loadOrders()
      
      // 等待DOM完全更新后启动滚动
      setTimeout(() => {
        startScrollAnimation()
      }, 500)
      
      // 监听滚动同步事件
      document.addEventListener('sync-scroll-pulse', handleSyncScroll)
      
      // 监听窗口大小变化，重新计算高度
      window.addEventListener('resize', updateHeights)
    })
    
    onUnmounted(() => {
      // 停止动画
      if (scrollAnimationId.value) {
        cancelAnimationFrame(scrollAnimationId.value)
      }
      
      // 移除事件监听
      document.removeEventListener('sync-scroll-pulse', handleSyncScroll)
      window.removeEventListener('resize', updateHeights)
    })
    
    return {
      displayOrders,
      shouldDuplicate,
      ordersContainer,
      ordersWrapper
    }
  }
}
</script>

<style scoped>
.order-header {
  background-color: #fff9f9;
  border-radius: 8px 8px 0 0;
  padding: 12px;
  margin-bottom: 2px;
  text-align: center;
}

.order-title {
  color: #e53935;
  font-weight: bold;
  font-size: 16px;
}

.orders-container {
  background-color: #f9f9f9;
  border-radius: 0 0 8px 8px;
  padding: 10px;
  margin-bottom: 15px;
  overflow: hidden;
  max-height: 300px;
  position: relative;
}

.orders-wrapper {
  display: flex;
  flex-direction: column;
  /* 移除CSS动画，使用JS控制 */
  will-change: transform;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: white;
  margin-bottom: 8px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.order-user {
  display: flex;
  align-items: center;
}

.order-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e53935;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
}

.order-info {
  display: flex;
  flex-direction: column;
}

.order-name {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.order-phone {
  color: #666;
  font-size: 12px;
}

.order-payment {
  text-align: right;
}

.order-status {
  color: #e53935;
  font-weight: bold;
  font-size: 14px;
}

.order-time {
  color: #666;
  font-size: 12px;
}
</style> 