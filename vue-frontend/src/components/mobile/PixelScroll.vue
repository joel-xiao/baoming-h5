<template>
  <div class="pixel-scroll-container" ref="container">
    <div class="pixel-scroll-wrapper" ref="wrapper" :style="wrapperStyle">
      <slot></slot>
      <!-- 如果需要无缝滚动，则复制内容 -->
      <div v-if="loop && shouldClone" class="pixel-scroll-clone">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

export default {
  name: 'PixelScroll',
  props: {
    // 是否循环滚动
    loop: {
      type: Boolean,
      default: true
    },
    // 滚动速度 (每帧移动的像素数)
    speed: {
      type: Number,
      default: 1.5
    },
    // 自动开始滚动
    autoStart: {
      type: Boolean,
      default: true
    },
    // 是否反向滚动
    reverse: {
      type: Boolean,
      default: false
    },
    // 完成一次滚动后暂停的时间（毫秒）
    pauseTime: {
      type: Number,
      default: 1000
    },
    // 容器高度
    height: {
      type: String,
      default: '200px'
    }
  },
  setup(props, { expose }) {
    const container = ref(null);
    const wrapper = ref(null);
    const scrollPosition = ref(0);
    const scrollDirection = ref(props.reverse ? -1 : 1);
    const scrollAnimationId = ref(null);
    const scrollPaused = ref(false);
    const totalHeight = ref(0);
    const containerHeight = ref(0);
    const currentSpeed = ref(props.speed);
    const instanceId = `pixel-scroll-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const shouldClone = ref(false);
    
    // 计算样式
    const wrapperStyle = computed(() => {
      return {
        transform: `translateY(${-scrollPosition.value}px)`,
      };
    });
    
    // 测量高度
    const measureHeights = () => {
      if (!container.value || !wrapper.value) return;
      
      // 测量真实高度，不包括克隆的部分
      const children = wrapper.value.children;
      if (children.length > 0) {
        const originalContent = children[0];
        totalHeight.value = originalContent.offsetHeight;
        containerHeight.value = container.value.offsetHeight;
        
        // 确定是否需要克隆
        shouldClone.value = props.loop && totalHeight.value < containerHeight.value * 3;
      }
    };
    
    // 调整滚动速度
    const adjustSpeed = () => {
      if (totalHeight.value === 0 || containerHeight.value === 0) return;
      
      // 不再根据内容高度调整速度，保持固定速度
      currentSpeed.value = props.speed;
    };
    
    // 开始滚动动画
    const startScrollAnimation = () => {
      if (scrollAnimationId.value) {
        cancelAnimationFrame(scrollAnimationId.value);
        scrollAnimationId.value = null;
      }
      
      // 测量并设置速度
      measureHeights();
      adjustSpeed();
      
      // 如果内容太少，不需要滚动
      if (totalHeight.value <= containerHeight.value && !props.loop) {
        return;
      }
      
      const scrollStep = () => {
        if (scrollPaused.value) {
          scrollAnimationId.value = requestAnimationFrame(scrollStep);
          return;
        }
        
        // 增加滚动位置
        scrollPosition.value += scrollDirection.value * currentSpeed.value;
        
        // 循环模式下的处理
        if (props.loop) {
          // 当滚动到底部时，从顶部重新开始
          if (scrollDirection.value > 0 && scrollPosition.value >= totalHeight.value + 5) {
            scrollPosition.value = 0;
          } 
          // 当向上滚动到顶部时，从底部重新开始
          else if (scrollDirection.value < 0 && scrollPosition.value <= -5) {
            scrollPosition.value = totalHeight.value;
          }
        } 
        // 非循环模式下的处理（来回滚动）
        else {
          // 到达底部，改变方向向上滚动
          if (scrollDirection.value > 0 && scrollPosition.value >= totalHeight.value - containerHeight.value) {
            // 确保滚动完全到达底部
            scrollPosition.value = totalHeight.value - containerHeight.value;
            // 暂停一下
            scrollPaused.value = true;
            setTimeout(() => {
              scrollDirection.value = -1;
              scrollPaused.value = false;
            }, props.pauseTime);
          } 
          // 到达顶部，改变方向向下滚动
          else if (scrollDirection.value < 0 && scrollPosition.value <= 0) {
            // 确保滚动完全到达顶部
            scrollPosition.value = 0;
            // 暂停一下
            scrollPaused.value = true;
            setTimeout(() => {
              scrollDirection.value = 1;
              scrollPaused.value = false;
            }, props.pauseTime);
          }
        }
        
        // 继续动画
        scrollAnimationId.value = requestAnimationFrame(scrollStep);
      };
      
      // 开始动画
      scrollAnimationId.value = requestAnimationFrame(scrollStep);
    };
    
    // 停止滚动
    const stopScrollAnimation = () => {
      if (scrollAnimationId.value) {
        cancelAnimationFrame(scrollAnimationId.value);
        scrollAnimationId.value = null;
      }
    };
    
    // 重置滚动位置
    const resetScroll = () => {
      scrollPosition.value = 0;
      scrollDirection.value = props.reverse ? -1 : 1;
      scrollPaused.value = false;
    };
    
    // 监听props变化
    watch(() => props.speed, (newSpeed) => {
      currentSpeed.value = newSpeed;
      adjustSpeed();
    });
    
    watch(() => props.reverse, (isReverse) => {
      scrollDirection.value = isReverse ? -1 : 1;
    });
    
    // 处理窗口大小改变
    const handleResize = () => {
      measureHeights();
      adjustSpeed();
    };
    
    // 处理滚动同步事件
    const handleSyncScroll = () => {
      resetScroll();
    };
    
    onMounted(() => {
      // 等待内容渲染
      setTimeout(() => {
        measureHeights();
        
        // 如果设置了自动开始
        if (props.autoStart) {
          startScrollAnimation();
        }
        
        // 注册到全局滚动管理器
        if (window.scrollUtils) {
          window.scrollUtils.registerScrollContainer(instanceId, {
            reset: resetScroll
          });
        }
      }, 100);
      
      // 监听事件
      window.addEventListener('resize', handleResize);
      document.addEventListener('sync-scroll-pulse', handleSyncScroll);
    });
    
    onUnmounted(() => {
      stopScrollAnimation();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('sync-scroll-pulse', handleSyncScroll);
    });
    
    // 暴露方法
    expose({
      start: startScrollAnimation,
      stop: stopScrollAnimation,
      reset: resetScroll
    });
    
    return {
      container,
      wrapper,
      wrapperStyle,
      shouldClone
    };
  }
};
</script>

<style scoped>
.pixel-scroll-container {
  width: 100%;
  height: v-bind('height');
  overflow: hidden;
  position: relative;
}

.pixel-scroll-wrapper {
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.pixel-scroll-clone {
  /* 克隆内容的样式可以在这里添加 */
}
</style> 