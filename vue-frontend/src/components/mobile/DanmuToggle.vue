<template>
  <div 
    class="danmu-toggle" 
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @click.stop="toggleDanmu"
    :class="{ 'expanded': showText, 'mobile': isMobile }"
  >
    <div class="danmu-icon">
      <svg v-if="isDanmuEnabled" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 6H3C2.4 6 2 6.4 2 7V17C2 17.6 2.4 18 3 18H21C21.6 18 22 17.6 22 17V7C22 6.4 21.6 6 21 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 10H18M8 14H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 6H3C2.4 6 2 6.4 2 7V17C2 17.6 2.4 18 3 18H21C21.6 18 22 17.6 22 17V7C22 6.4 21.6 6 21 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 4L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="toggle-text">{{ isDanmuEnabled ? '弹幕已开启' : '弹幕已关闭' }}</span>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useDanmu } from '@/store/hooks'

export default {
  name: 'DanmuToggle',
  setup() {
    const store = useStore()
    const danmuHook = useDanmu()
    const showText = ref(false)
    const touchStartTime = ref(0)
    const isTouchMove = ref(false)
    const isMobile = ref(false)
    
    // 检测设备类型
    const checkDeviceType = () => {
      isMobile.value = window.innerWidth <= 768
    }
    
    // 鼠标进入事件处理
    const handleMouseEnter = () => {
      if (!isMobile.value) {
        showText.value = true
      }
    }
    
    // 鼠标离开事件处理
    const handleMouseLeave = () => {
      if (!isMobile.value) {
        showText.value = false
      }
    }
    
    // 通过计算属性获取弹幕状态
    const isDanmuEnabled = computed(() => {
      // 检查danmuHook是否初始化
      if (!danmuHook || !danmuHook.isDanmuEnabled) {
        console.error('弹幕Hook未正确初始化');
        return false;
      }
      return danmuHook.isDanmuEnabled.value;
    })
    
    // 处理触摸开始
    const handleTouchStart = (e) => {
      touchStartTime.value = Date.now()
      isTouchMove.value = false
      if (!isMobile.value) {
        showText.value = true
      }
    }
    
    // 处理触摸移动
    const handleTouchMove = (e) => {
      isTouchMove.value = true
    }
    
    // 处理触摸结束
    const handleTouchEnd = (e) => {
      // 如果触摸时间少于300ms且没有移动，则认为是点击
      if (Date.now() - touchStartTime.value < 300 && !isTouchMove.value) {
        toggleDanmu(e)
      }
      
      // 如果是移动设备（通过窗口宽度判断），不展示文本
      if (isMobile.value) {
        showText.value = false
      } else {
        // 在非移动设备上，1.5秒后隐藏文字
        setTimeout(() => {
          showText.value = false
        }, 1500)
      }
    }
    
    // 切换弹幕状态
    const toggleDanmu = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (!danmuHook || !danmuHook.isDanmuEnabled || !danmuHook.updateDanmuConfig) {
        console.error('弹幕Hook未正确初始化，无法切换弹幕状态');
        return;
      }
      
      const newStatus = !isDanmuEnabled.value;
      console.log('切换弹幕状态:', isDanmuEnabled.value, '->', newStatus);
      
      // 使用danmuHook更新配置
      const frequency = danmuHook.danmuFrequency ? danmuHook.danmuFrequency.value : 1500;
      danmuHook.updateDanmuConfig({
        enabled: newStatus,
        frequency: frequency
      });
      
      // 如果关闭弹幕，立即触发事件通知清除弹幕
      if (!newStatus) {
        document.dispatchEvent(new CustomEvent('clear-all-danmu'));
      }
      
      // 在非移动设备上短暂展示文字，然后自动隐藏
      if (!isMobile.value) {
        showText.value = true;
        setTimeout(() => {
          showText.value = false;
        }, 1500);
      } else {
        // 在移动设备上不展示文字
        showText.value = false;
      }
    }
    
    // 监听窗口大小变化
    onMounted(() => {
      checkDeviceType()
      window.addEventListener('resize', checkDeviceType)
    })
    
    onUnmounted(() => {
      window.removeEventListener('resize', checkDeviceType)
    })
    
    return {
      isDanmuEnabled,
      toggleDanmu,
      showText,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseEnter,
      handleMouseLeave,
      isMobile
    }
  }
}
</script>

<style scoped>
.danmu-toggle {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  background-color: rgba(229, 57, 53, 0.7);
  color: white;
  padding: 8px 10px;
  border-radius: 30px 0 0 30px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
  touch-action: manipulation;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 10px rgba(229, 57, 53, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-right: none;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.danmu-toggle:hover, .danmu-toggle.expanded {
  background-color: rgba(229, 57, 53, 0.9);
  box-shadow: 0 4px 15px rgba(229, 57, 53, 0.5);
}

.danmu-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  opacity: 0.9;
}

.toggle-text {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  letter-spacing: 0.5px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.danmu-toggle:hover .toggle-text, .danmu-toggle.expanded .toggle-text {
  max-width: 100px;
  opacity: 1;
}

/* 移动设备样式 */
.danmu-toggle.mobile {
  padding: 6px 8px;
  /* 可以再减小一些尺寸 */
  border-radius: 20px 0 0 20px;
}

.danmu-toggle.mobile .danmu-icon {
  width: 14px;
  height: 14px;
  margin-right: 0;
}

.danmu-toggle.mobile .toggle-text {
  display: none; /* 在移动设备上完全隐藏文本 */
}

/* 媒体查询以确保兼容性 */
@media (max-width: 768px) {
  .danmu-toggle {
    padding: 6px 8px;
  }
  
  .danmu-toggle.expanded .toggle-text {
    max-width: 0;
    opacity: 0;
  }
}
</style> 