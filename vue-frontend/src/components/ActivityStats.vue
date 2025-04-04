<template>
  <div class="stats-panel">
    <div class="stats-header">
      <div class="participant-count">活动参与 <span class="count-number">{{ participantsCountFormatted }}</span> 人</div>
      <div class="view-count">浏览量 <span class="view-number">{{ viewsCount }}</span> 次</div>
    </div>
    <div class="participants-container" 
         @mouseenter="pauseScrolling" 
         @mouseleave="resumeScrolling"
         @touchstart="pauseScrolling" 
         @touchend="resumeScrolling">
      <div class="participants-wrapper" ref="participantsWrapper">
        <div class="participants-list">
          <div class="participant" v-for="(participant, index) in displayedParticipants" :key="index">
            <div class="participant-avatar">{{ getAvatarText(participant) }}</div>
            <div class="participant-name">{{ participant.name }}</div>
          </div>
        </div>
        <div class="participants-list">
          <div class="participant" v-for="(participant, index) in displayedParticipants" :key="`dup-${index}`">
            <div class="participant-avatar">{{ getAvatarText(participant) }}</div>
            <div class="participant-name">{{ participant.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ActivityStats',
  setup() {
    const store = useStore()
    const participantsWrapper = ref(null)
    
    // 添加滚动动画的相关状态
    const scrollPosition = ref(0)
    const scrollDirection = ref(1) // 1向下滚动，-1向上滚动
    const scrollAnimationId = ref(null)
    const scrollPaused = ref(false)
    const isUserPaused = ref(false) // 用户手动暂停状态
    const totalHeight = ref(0)
    const containerHeight = ref(0)
    
    // 从store获取参与者数据和统计数据
    const participants = computed(() => store.state.participants)
    const statsData = computed(() => {
      const data = store.state.activityStats;
      console.log('活动统计数据已更新:', data);
      return data;
    })
    
    const participantsCount = computed(() => {
      // 优先使用API获取到的统计数据
      if (statsData.value && typeof statsData.value.totalCount === 'number') {
        return statsData.value.totalCount
      }
      
      // 备用方案：使用participants数组的实际长度
      return participants.value.length || 0
    })
    
    const participantsCountFormatted = computed(() => {
      const formatted = participantsCount.value.toString().padStart(2, '0')
      return formatted
    })
    
    // 浏览量计算属性 - 直接从store中获取
    const viewsCount = computed(() => {
      // 从store中获取浏览量
      console.log('从store获取浏览量:', store.state.activityStats?.viewsCount);
      const storeViews = store.state.activityStats?.viewsCount;
      if (storeViews !== undefined && storeViews !== null) {
        // 确保是数字
        const numViews = Number(storeViews);
        if (!isNaN(numViews)) {
          return numViews;
        }
      }
      
      // 如果获取不到，返回0
      console.warn('浏览量数据不可用，使用默认值0');
      return 0;
    })
    
    // 获取显示的参与者，最多显示15个
    const displayedParticipants = computed(() => {
      if (participants.value && participants.value.length > 0) {
        return participants.value.slice(0, 15)
      }
      // 没有数据则返回空数组
      return [];
    })
    
    // 设置定时刷新
    const refreshInterval = ref(null)
    
    // 刷新统计数据 - 只通过store更新
    const refreshStats = async () => {
      console.log('正在刷新统计数据...');
      
      // 通过store更新完整统计数据
      store.dispatch('loadActivityStats')
        .then(() => {
          console.log('统计数据刷新成功:', store.state.activityStats);
        })
        .catch(err => {
          console.error('获取统计数据失败:', err);
        });
    }
    
    // 获取头像文字
    const getAvatarText = (participant) => {
      return participant.avatar || participant.name.charAt(0)
    }
    
    // 用户手动暂停滚动动画
    const pauseScrolling = () => {
      isUserPaused.value = true;
      scrollPaused.value = true;
    }
    
    // 用户手动恢复滚动动画
    const resumeScrolling = () => {
      isUserPaused.value = false;
      scrollPaused.value = false;
    }
    
    // 测量滚动所需的元素高度
    const measureHeights = () => {
      if (!participantsWrapper.value) return;
      
      const firstList = participantsWrapper.value.querySelector('.participants-list');
      if (!firstList) return;
      
      // 获取单个列表高度
      totalHeight.value = firstList.offsetHeight;
      // 获取容器高度
      containerHeight.value = participantsWrapper.value.parentElement.offsetHeight;
      
      console.log('测量高度 - 列表高度:', totalHeight.value, '容器高度:', containerHeight.value);
    }
    
    // 基于JavaScript的滚动动画实现 - 优化版本
    const startScrollAnimation = () => {
      // 取消之前的动画
      if (scrollAnimationId.value) {
        cancelAnimationFrame(scrollAnimationId.value);
      }
      
      // 测量容器和内容高度
      measureHeights();
      
      // 检查是否有足够的内容进行滚动
      if (totalHeight.value <= containerHeight.value) {
        console.log('内容高度不足以滚动，暂停动画');
        return;
      }
      
      // 无限循环滚动动画函数
      const scrollStep = () => {
        // 用户手动暂停或系统暂停
        if (scrollPaused.value) {
          scrollAnimationId.value = requestAnimationFrame(scrollStep);
          return;
        }
        
        // 动态调整滚动速度 - 基于内容量
        const baseSpeed = 0.8; // 基础滚动速度
        const contentRatio = Math.min(totalHeight.value / containerHeight.value, 3); // 限制最大比例为3
        const speed = baseSpeed * (contentRatio > 1 ? contentRatio * 0.5 : 1); // 内容越多速度越快，但控制增长率
        
        // 更新滚动位置
        scrollPosition.value += scrollDirection.value * speed;
        
        // 循环滚动逻辑
        if (scrollDirection.value > 0 && scrollPosition.value >= totalHeight.value) {
          // 向下滚动到底部时，无缝重置到顶部
          scrollPosition.value = 0;
        } else if (scrollDirection.value < 0 && scrollPosition.value <= 0) {
          // 向上滚动到顶部时，无缝重置到底部
          scrollPosition.value = totalHeight.value;
        }
        
        // 应用滚动位置
        if (participantsWrapper.value) {
          participantsWrapper.value.style.transform = `translateY(-${scrollPosition.value}px)`;
        }
        
        // 继续动画循环
        scrollAnimationId.value = requestAnimationFrame(scrollStep);
      };
      
      // 启动动画
      scrollAnimationId.value = requestAnimationFrame(scrollStep);
    };
    
    // 同步滚动处理函数 - 重置滚动位置
    const handleSyncScroll = () => {
      if (participantsWrapper.value) {
        // 重置滚动位置和方向
        scrollPosition.value = 0;
        scrollDirection.value = 1;
        if (!isUserPaused.value) {
          scrollPaused.value = false;
        }
        
        // 重新应用
        participantsWrapper.value.style.transform = `translateY(0px)`;
      }
    };
    
    // 数据更新后重新初始化滚动
    const reinitializeScroll = () => {
      // 当数据更新后，测量新的高度并重新启动滚动
      setTimeout(() => {
        measureHeights();
        if (scrollAnimationId.value) {
          cancelAnimationFrame(scrollAnimationId.value);
          scrollAnimationId.value = null;
        }
        startScrollAnimation();
      }, 300); // 给DOM一点时间更新
    };
    
    onMounted(async () => {
      console.log('ActivityStats组件已挂载');
      
      // 首先检查store中是否已有数据
      console.log('当前store中的活动统计数据:', store.state.activityStats);
      
      // 只有当store中没有数据时才请求刷新
      if (!store.state.activityStats) {
        console.log('store中没有统计数据，请求刷新');
        refreshStats();
      } else {
        console.log('store中已有统计数据，跳过初始加载');
      }
      
      // 设置定时刷新 - 每30秒刷新一次 (增加间隔减少请求次数)
      refreshInterval.value = setInterval(refreshStats, 30000);
      
      // 确保参与者数据加载
      if (participants.value.length === 0) {
        console.log('参与者数据为空，请求加载');
        store.dispatch('loadParticipants').then(() => {
          // 数据加载完成后，初始化滚动
          reinitializeScroll();
        });
      } else {
        // 已有数据，直接初始化滚动
        setTimeout(() => {
          startScrollAnimation();
        }, 500);
      }
      
      // 监听滚动同步事件
      document.addEventListener('sync-scroll-pulse', handleSyncScroll);
      
      // 监听窗口大小变化，重新计算高度
      window.addEventListener('resize', () => {
        measureHeights();
        // 如果高度发生显著变化，重新初始化滚动
        if (totalHeight.value > 0 && containerHeight.value > 0) {
          reinitializeScroll();
        }
      });
      
      // 监听数据变化
      const unwatch = store.watch(
        () => store.state.participants.length,
        (newLength) => {
          if (newLength > 0) {
            console.log('参与者数据变化，重新初始化滚动');
            reinitializeScroll();
          }
        }
      );
    })
    
    onUnmounted(() => {
      // 停止定时刷新
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }
      
      // 停止动画
      if (scrollAnimationId.value) {
        cancelAnimationFrame(scrollAnimationId.value)
      }
      
      // 移除事件监听
      document.removeEventListener('sync-scroll-pulse', handleSyncScroll)
      window.removeEventListener('resize', () => {})
    })
    
    return {
      participantsCountFormatted,
      viewsCount,
      displayedParticipants,
      getAvatarText,
      participantsWrapper,
      pauseScrolling,
      resumeScrolling
    }
  }
}
</script>

<style scoped>
.stats-panel {
  width: 100%;
  background-color: #fff8e8;
  border-radius: 8px;
  overflow: hidden;
  margin: 10px 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.participant-count, .view-count {
  font-size: 12px;
  color: #333;
  font-weight: 400;
}

.count-number {
  display: inline-block;
  background-color: #ff453a;
  color: white;
  padding: 1px 5px;
  border-radius: 10px;
  margin: 0 3px;
  font-weight: bold;
  font-size: 12px;
}

.view-number {
  display: inline-block;
  background-color: #f9c24a;
  color: white;
  padding: 1px 5px;
  border-radius: 10px;
  margin: 0 3px;
  font-weight: bold;
  font-size: 12px;
}

.participants-container {
  background-color: #fff8e8;
  overflow: hidden;
  padding: 10px;
  height: 180px;
  position: relative;
  cursor: pointer; /* 添加指针样式，提示用户可互动 */
}

.participants-wrapper {
  display: flex;
  flex-direction: column;
  will-change: transform;
  transition: transform 0.3s cubic-bezier(0.215, 0.610, 0.355, 1.000) when-paused; /* 暂停时平滑过渡 */
}

.participants-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  min-height: 180px;
}

.participant {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 5px;
}

.participant-name {
  font-size: 11px;
  color: #666;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
