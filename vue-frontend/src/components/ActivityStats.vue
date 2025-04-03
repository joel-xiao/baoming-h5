<template>
  <div class="stats-panel">
    <div class="stats-header">
      <div class="participant-count">活动参与 <span class="count-number">{{ participantsCountFormatted }}</span> 人</div>
      <div class="view-count">浏览量 <span class="view-number">{{ viewsCount }}</span> 次</div>
    </div>
    <div class="participants-container">
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
    const totalHeight = ref(0)
    const containerHeight = ref(0)
    
    // 从store获取参与者数据
    const participants = computed(() => store.state.participants)
    
    const participantsCount = computed(() => {
      // 使用participants数组的实际长度作为参与者数量
      const length = participants.value.length;
      const defaultCount = store.state.activityConfig?.defaultStats?.participants || 76;
      const result = length || defaultCount;
      console.log('参与者数组长度:', length, '默认值:', defaultCount, '最终使用:', result);
      return result;
    })
    
    const participantsCountFormatted = computed(() => {
      const formatted = participantsCount.value.toString().padStart(2, '0');
      console.log('格式化后的参与者数量:', formatted);
      return formatted;
    })
    
    const viewsCount = computed(() => {
      // 从store中获取浏览量
      return store.state.activityConfig?.defaultStats?.views || 2716
    })
    
    // 获取显示的参与者，最多显示15个
    const displayedParticipants = computed(() => {
      if (participants.value && participants.value.length > 0) {
        return participants.value.slice(0, 15)
      }
      
      // 如果store中没有参与者数据，使用默认数据
      const mockNames = [
        '一*三', '贺*梦', 'S***e', '*', '盼**秀', 
        '段**', 'Y***?', '我**家', 'j****k', '永**斗', 
        '曹*娟', '桃*桃', '囧***~', '李*锐', '魏**'
      ]
      
      return mockNames.map(name => ({
        name,
        avatar: name.charAt(0)
      }))
    })
    
    // 获取头像文字
    const getAvatarText = (participant) => {
      return participant.avatar || participant.name.charAt(0)
    }
    
    // 基于JavaScript的滚动动画实现
    const startScrollAnimation = () => {
      if (scrollAnimationId.value) {
        cancelAnimationFrame(scrollAnimationId.value)
      }
      
      // 测量容器和内容高度
      if (participantsWrapper.value) {
        const firstList = participantsWrapper.value.querySelector('.participants-list')
        if (firstList) {
          // 获取真实内容高度
          totalHeight.value = firstList.offsetHeight
          // 获取可视容器高度
          containerHeight.value = participantsWrapper.value.parentElement.offsetHeight
        }
      }
      
      const scrollStep = () => {
        if (scrollPaused.value) {
          scrollAnimationId.value = requestAnimationFrame(scrollStep)
          return
        }
        
        // 使用固定的滚动速度，不再根据内容量调整
        const speed = 1.5
        
        // 增加滚动位置
        scrollPosition.value += scrollDirection.value * speed
        
        // 检查是否需要改变方向
        if (scrollDirection.value > 0 && scrollPosition.value >= totalHeight.value) {
          // 确保滚动完全到达底部
          scrollPosition.value = totalHeight.value;
          // 到达底部，延迟一下然后向上滚动
          scrollPaused.value = true
          setTimeout(() => {
            scrollDirection.value = -1
            scrollPaused.value = false
          }, 1000)
        } else if (scrollDirection.value < 0 && scrollPosition.value <= 0) {
          // 确保滚动完全到达顶部
          scrollPosition.value = 0;
          // 到达顶部，延迟一下然后向下滚动
          scrollPaused.value = true
          setTimeout(() => {
            scrollDirection.value = 1
            scrollPaused.value = false
          }, 1000)
        }
        
        // 应用滚动位置
        if (participantsWrapper.value) {
          participantsWrapper.value.style.transform = `translateY(-${scrollPosition.value}px)`
        }
        
        // 继续动画循环
        scrollAnimationId.value = requestAnimationFrame(scrollStep)
      }
      
      // 开始动画
      scrollAnimationId.value = requestAnimationFrame(scrollStep)
    }
    
    // 同步滚动处理函数 - 重置滚动位置
    const handleSyncScroll = () => {
      if (participantsWrapper.value) {
        // 重置滚动位置和方向
        scrollPosition.value = 0
        scrollDirection.value = 1
        scrollPaused.value = false
        
        // 重新应用
        participantsWrapper.value.style.transform = `translateY(0px)`
      }
    }
    
    onMounted(() => {
      // 确保数据已加载 - 无条件加载参与者数据
      store.dispatch('loadParticipants')
      
      // 启动滚动动画
      startScrollAnimation()
      
      // 监听滚动同步事件
      document.addEventListener('sync-scroll-pulse', handleSyncScroll)
      
      // 监听窗口大小变化，重新计算高度
      window.addEventListener('resize', () => {
        if (participantsWrapper.value) {
          const firstList = participantsWrapper.value.querySelector('.participants-list')
          if (firstList) {
            totalHeight.value = firstList.offsetHeight
            containerHeight.value = participantsWrapper.value.parentElement.offsetHeight
          }
        }
      })
    })
    
    onUnmounted(() => {
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
      participantsWrapper
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
}

.participants-wrapper {
  display: flex;
  flex-direction: column;
  /* 移除CSS动画，改用JS控制 */
  will-change: transform;
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

/* 移除CSS关键帧动画 */
</style>