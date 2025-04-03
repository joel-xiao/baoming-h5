<template>
  <div>
    <!-- 客服按钮 -->
    <div 
      class="customer-service-btn" 
      @click="showServiceModal"
      @touchstart="startDrag"
      @touchmove="onDrag"
      @touchend="endDrag"
      @mousedown="startMouseDrag"
      :style="btnStyle"
    >
      <div class="cs-btn-content">
        <i class="iconfont icon-service"></i>
        <span>客服</span>
      </div>
    </div>
    
    <!-- 客服弹窗 -->
    <div class="cs-modal" :class="{ show: isModalVisible }">
      <div class="cs-modal-content">
        <div class="cs-header">
          <div class="vip-tag">VIP专线</div>
          <div class="cs-title">您的专属客服</div>
        </div>
        <div class="cs-body">
          <div class="cs-text">{{ price }}元线上拓客案</div>
          <div class="cs-phone">15269275853</div>
          <div class="cs-call-btn" @click="callService">
            <i class="iconfont icon-phone"></i>
            <span class="call-text">拨打电话</span>
          </div>
        </div>
        <div class="cs-footer">
          <div class="cs-wechat-title">如何添加客服微信</div>
          <div class="cs-wechat-text">
            <p>截图保存客服二维码</p>
            <p>打开微信"扫一扫"添加好友即可</p>
          </div>
          <div class="cs-qrcode">
            <img src="/img/qrcode.jpg" alt="客服微信二维码">
          </div>
        </div>
        <button class="cs-close-btn" @click="hideServiceModal">×</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'CustomerService',
  setup() {
    const store = useStore()
    const isModalVisible = ref(false)
    const isDragging = ref(false)
    const startY = ref(0)
    const startX = ref(0)
    const position = reactive({
      x: 10,  // 默认贴右边，稍微偏移
      y: window.innerHeight - 150  // 在底部按钮上方适当位置
    })
    
    // 计算按钮样式
    const btnStyle = computed(() => {
      // 根据屏幕尺寸动态调整位置
      const isMobile = window.innerWidth <= 375
      const isExtraSmall = window.innerWidth <= 320
      
      let yOffset = 150
      
      // 根据不同屏幕尺寸调整垂直位置
      if (isExtraSmall) {
        yOffset = 130
      } else if (isMobile) {
        yOffset = 140
      }
      
      return {
        top: `${window.innerHeight - yOffset}px`,
        right: `${position.x}px`
      }
    })
    
    // 开始触摸拖动
    const startDrag = (e) => {
      isDragging.value = true
      startY.value = e.touches[0].clientY
      startX.value = e.touches[0].clientX
    }
    
    // 触摸拖动中
    const onDrag = (e) => {
      if (!isDragging.value) return
      
      e.preventDefault() // 防止页面滚动
      
      const touchY = e.touches[0].clientY
      const touchX = e.touches[0].clientX
      
      const deltaY = touchY - startY.value
      const deltaX = touchX - startX.value
      
      position.y += deltaY
      position.x -= deltaX  // 注意这里取反，因为我们使用的是right属性
      
      // 限制在屏幕内
      if (position.y < 0) position.y = 0
      if (position.y > window.innerHeight - 60) position.y = window.innerHeight - 60
      if (position.x < 0) position.x = 0
      if (position.x > window.innerWidth - 60) position.x = 0
      
      startY.value = touchY
      startX.value = touchX
    }
    
    // 结束拖动
    const endDrag = () => {
      isDragging.value = false
      
      // 贴边吸附
      position.x = 10 // 贴右边，留有一点边距
    }
    
    // 开始鼠标拖动
    const startMouseDrag = (e) => {
      isDragging.value = true
      startY.value = e.clientY
      startX.value = e.clientX
      
      // 添加鼠标事件监听器
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', endMouseDrag)
    }
    
    // 鼠标拖动中
    const onMouseMove = (e) => {
      if (!isDragging.value) return
      
      const mouseY = e.clientY
      const mouseX = e.clientX
      
      const deltaY = mouseY - startY.value
      const deltaX = mouseX - startX.value
      
      position.y += deltaY
      position.x -= deltaX  // 注意这里取反，因为我们使用的是right属性
      
      // 限制在屏幕内
      if (position.y < 0) position.y = 0
      if (position.y > window.innerHeight - 60) position.y = window.innerHeight - 60
      if (position.x < 0) position.x = 0
      if (position.x > window.innerWidth - 60) position.x = 0
      
      startY.value = mouseY
      startX.value = mouseX
    }
    
    // 结束鼠标拖动
    const endMouseDrag = () => {
      isDragging.value = false
      
      // 贴边吸附
      position.x = 10 // 贴右边，留有一点边距
      
      // 移除事件监听器
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', endMouseDrag)
    }
    
    // 重新计算初始位置
    const updatePosition = () => {
      // 根据屏幕尺寸动态调整位置
      const isMobile = window.innerWidth <= 375
      const isExtraSmall = window.innerWidth <= 320
      
      let yOffset = 150
      
      // 根据不同屏幕尺寸调整垂直位置
      if (isExtraSmall) {
        yOffset = 130
      } else if (isMobile) {
        yOffset = 140
      }
      
      position.y = window.innerHeight - yOffset
    }
    
    // 监听窗口大小变化
    onMounted(() => {
      window.addEventListener('resize', updatePosition)
      updatePosition() // 初始化时计算一次位置
    })
    
    onUnmounted(() => {
      window.removeEventListener('resize', updatePosition)
    })
    
    const price = computed(() => store.state.activityConfig.price)
    
    const showServiceModal = () => {
      if (!isDragging.value) {
        isModalVisible.value = true
      }
    }
    
    const hideServiceModal = () => {
      isModalVisible.value = false
    }
    
    const callService = () => {
      window.location.href = 'tel:15269275853'
    }
    
    return {
      isModalVisible,
      price,
      showServiceModal,
      hideServiceModal,
      callService,
      startDrag,
      onDrag,
      endDrag,
      startMouseDrag,
      btnStyle
    }
  }
}
</script>

<style scoped>
.customer-service-btn {
  position: fixed;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #e53935, #f44336);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(229, 57, 53, 0.35);
  cursor: pointer;
  z-index: 90;
  transition: all 0.3s ease;
  touch-action: none; /* 防止触摸操作引起页面滚动 */
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  transform-origin: center;
  overflow: hidden;
}

.cs-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  padding: 5px;
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.customer-service-btn:hover .cs-btn-content {
  transform: translateY(-3px);
}

.customer-service-btn:active {
  transform: scale(0.92);
  box-shadow: 0 2px 6px rgba(229, 57, 53, 0.3);
}

.customer-service-btn::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.5s ease;
}

.customer-service-btn:hover::after {
  opacity: 1;
  transform: scale(1);
}

.customer-service-btn i {
  font-size: 20px;
  margin-bottom: 3px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.customer-service-btn span {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.cs-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  justify-content: center;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
  overflow-y: auto;
}

.cs-modal.show {
  display: flex;
}

.cs-modal-content {
  position: relative;
  width: 90%;
  max-width: 340px;
  margin: 0 auto;
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  animation: modal-appear 0.3s ease-out;
  transform-origin: center;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cs-header {
  padding: 20px;
  background: linear-gradient(135deg, #e53935, #f44336);
  color: white;
  display: flex;
  align-items: center;
}

.vip-tag {
  background: linear-gradient(135deg, #FFD700, #FFC107);
  color: #5D4037;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.cs-title {
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.cs-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(245,245,245,0.5) 100%);
}

.cs-text {
  font-size: 15px;
  color: #555;
  margin-bottom: 12px;
  position: relative;
  padding-bottom: 12px;
}

.cs-text::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #e53935, rgba(244, 67, 54, 0.5));
  border-radius: 3px;
}

.cs-phone {
  font-size: 22px;
  font-weight: bold;
  color: #e53935;
  margin-bottom: 15px;
  letter-spacing: 1px;
  position: relative;
  padding: 6px 12px;
  background-color: rgba(229, 57, 53, 0.1);
  border-radius: 8px;
  border: 1px dashed rgba(229, 57, 53, 0.3);
}

.cs-call-btn {
  width: auto;
  height: 44px;
  background: linear-gradient(135deg, #e53935, #f44336);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(229, 57, 53, 0.4);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0 20px;
}

.cs-call-btn:hover {
  transform: scale(1.05);
}

.cs-call-btn:active {
  transform: scale(0.95);
}

.cs-call-btn i {
  font-size: 22px;
  margin-right: 8px;
}

.call-text {
  font-size: 16px;
  font-weight: 500;
}

.cs-footer {
  padding: 16px;
  background-color: #f7f7f7;
  text-align: center;
  border-top: 1px solid rgba(0,0,0,0.05);
  overflow-y: auto;
  flex: 1;
}

.cs-wechat-title {
  font-size: 15px;
  font-weight: bold;
  color: #e53935;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
}

.cs-wechat-title::before,
.cs-wechat-title::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 30px;
  height: 1px;
  background-color: rgba(229, 57, 53, 0.3);
}

.cs-wechat-title::before {
  left: -40px;
}

.cs-wechat-title::after {
  right: -40px;
}

.cs-wechat-text {
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.cs-wechat-text p {
  margin: 5px 0;
  line-height: 1.5;
}

.cs-qrcode {
  max-width: 150px;
  margin: 0 auto;
  position: relative;
}

.cs-qrcode::before {
  content: "";
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border: 2px dashed rgba(229, 57, 53, 0.3);
  border-radius: 15px;
  z-index: -1;
}

.cs-qrcode img {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.cs-qrcode img:hover {
  transform: scale(1.02);
}

.cs-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 18px;
  color: rgba(255, 255, 255, 1);
  cursor: pointer;
  z-index: 1001;
  width: 24px;
  height: 24px;
  text-align: center;
  line-height: 24px;
  background-color: rgba(229, 57, 53, 0.8);
  border-radius: 50%;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  padding: 0;
  font-weight: 300;
}

.cs-close-btn:hover {
  color: white;
  background-color: rgba(229, 57, 53, 1);
  transform: rotate(90deg);
  box-shadow: 0 3px 8px rgba(229, 57, 53, 0.4);
}

/* 响应式设计 - 小尺寸手机适配 */
@media screen and (max-width: 375px) {
  .customer-service-btn {
    width: 44px;
    height: 44px;
    right: 10px !important;
  }
  
  .customer-service-btn i {
    font-size: 18px;
    margin-bottom: 1px;
  }
  
  .customer-service-btn span {
    font-size: 10px;
  }
  
  .cs-modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .cs-header {
    padding: 12px;
  }
  
  .cs-title {
    font-size: 15px;
  }
  
  .cs-body {
    padding: 15px 12px;
  }
  
  .cs-text {
    font-size: 14px;
    margin-bottom: 10px;
    padding-bottom: 10px;
  }
  
  .cs-text::after {
    width: 30px;
    height: 2px;
  }
  
  .cs-phone {
    font-size: 18px;
    padding: 5px 10px;
    margin-bottom: 12px;
  }
  
  .cs-call-btn {
    height: 40px;
    padding: 0 15px;
  }
  
  .cs-call-btn i {
    font-size: 18px;
  }
  
  .call-text {
    font-size: 14px;
  }
  
  .cs-footer {
    padding: 15px 12px;
  }
  
  .cs-wechat-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .cs-wechat-title::before,
  .cs-wechat-title::after {
    width: 20px;
  }
  
  .cs-wechat-title::before {
    left: -30px;
  }
  
  .cs-wechat-title::after {
    right: -30px;
  }
  
  .cs-wechat-text {
    font-size: 12px;
    padding: 6px;
    margin-bottom: 12px;
  }
  
  .cs-qrcode {
    max-width: 130px;
  }
  
  .cs-close-btn {
    top: 10px;
    right: 10px;
    width: 22px;
    height: 22px;
    font-size: 16px;
    line-height: 22px;
  }
}

/* 超小尺寸手机适配 */
@media screen and (max-width: 320px) {
  .customer-service-btn {
    width: 40px;
    height: 40px;
    right: 8px !important;
  }
  
  .cs-modal-content {
    width: 98%;
    max-height: 98vh;
  }
  
  .vip-tag {
    padding: 2px 6px;
    font-size: 10px;
  }
  
  .cs-header {
    padding: 10px;
  }
  
  .cs-body {
    padding: 12px 10px;
  }
  
  .cs-footer {
    padding: 12px 10px;
  }
  
  .cs-text {
    font-size: 13px;
  }
  
  .cs-phone {
    font-size: 18px;
  }
  
  .cs-wechat-text {
    margin-bottom: 10px;
  }
  
  .cs-qrcode {
    max-width: 120px;
  }
}
</style> 