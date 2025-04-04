<template>
  <div class="danmu-container" ref="danmuContainer">
    <!-- 弹幕将在这里动态生成 -->
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useActivity, useDanmu } from '@/store/hooks'

export default {
  name: 'DanmuContainer',
  setup() {
    // 使用模块化hooks
    const activity = useActivity()
    const danmuHook = useDanmu()
    
    // 检查hooks是否正确初始化
    if (!danmuHook) {
      console.error('弹幕Hook初始化失败');
      // 返回一个最小可行组件，避免整个组件崩溃
      return {
        danmuContainer: ref(null)
      }
    }
    
    const danmuContainer = ref(null)
    let danmuInterval = null
    
    // 弹幕队列和弹幕墙配置
    const danmuQueue = ref([])
    const activeDanmuCount = ref(0)
    const MAX_ACTIVE_DANMU = 30 // 增加最大弹幕数
    const TRACKS_COUNT = 12 // 增加轨道数量，使弹幕垂直分布更均匀
    
    // 弹幕颜色库 - 背景几乎透明
    const danmuColors = [
      { bg: 'rgba(0, 0, 0, 0.1)', border: '#ffffff' }
    ]
    
    // 特殊弹幕颜色 - 使用相同透明背景
    const specialColors = {
      highlight: { bg: 'rgba(0, 0, 0, 0.1)', border: '#ffffff' },
      team: { bg: 'rgba(0, 0, 0, 0.1)', border: '#ffffff' },
      success: { bg: 'rgba(0, 0, 0, 0.1)', border: '#ffffff' }
    }
    
    // 弹幕消息
    const danmuMessages = [
      { text: '刚刚报名了', type: 'normal' },
      { text: '课程真不错', type: 'normal' },
      { text: '已经续报了', type: 'normal' },
      { text: '老师教得好', type: 'normal' },
      { text: '孩子进步大', type: 'normal' },
      { text: '性价比高', type: 'normal' },
      { text: '推荐朋友了', type: 'normal' },
      { text: '我要报名', type: 'highlight' },
      { text: '即将开课', type: 'normal' },
      { text: '教练专业', type: 'normal' },
      { text: '组队成功', type: 'team' },
      { text: '已成为队长', type: 'team' },
      { text: '支付成功', type: 'success' },
      { text: '氛围很好', type: 'normal' },
      { text: '太值了', type: 'highlight' },
      { text: '孩子喜欢', type: 'normal' },
      { text: '设施齐全', type: 'normal' },
      { text: '很专业', type: 'normal' },
      { text: '推荐了朋友', type: 'normal' },
      { text: '好评', type: 'normal' },
      { text: '课程超赞', type: 'normal' },
      { text: '老师很耐心', type: 'normal' },
      { text: '效果明显', type: 'normal' },
      { text: '续费第二期', type: 'highlight' },
      { text: '求拼团', type: 'team' }
    ]
    
    // 随机生成用户名
    const generateRandomName = () => {
      const names = activity.participants.value?.map(p => p.name) || []
      if (names.length === 0) {
        return '用户' + Math.floor(Math.random() * 1000)
      }
      return names[Math.floor(Math.random() * names.length)]
    }
    
    // 获取随机颜色
    const getRandomColor = (type) => {
      if (type === 'team') {
        return { bgColor: specialColors.team.bg, border: specialColors.team.border }
      } else if (type === 'success') {
        return { bgColor: specialColors.success.bg, border: specialColors.success.border }
      } else if (type === 'highlight') {
        return { bgColor: specialColors.highlight.bg, border: specialColors.highlight.border }
      } else {
        // 普通弹幕使用随机颜色
        const color = danmuColors[Math.floor(Math.random() * danmuColors.length)]
        return { bgColor: color.bg, border: color.border }
      }
    }
    
    // 获取随机透明度
    const getRandomOpacity = (type) => {
      return 1; // 始终返回不透明
    }
    
    // 处理弹幕队列
    const processQueue = () => {
      // 如果队列中有弹幕，且当前活跃弹幕数量小于最大限制，则显示队列中的弹幕
      if (danmuQueue.value.length > 0 && activeDanmuCount.value < MAX_ACTIVE_DANMU) {
        const danmuData = danmuQueue.value.shift()
        // 为弹幕分配轨道，确保有足够间距
        const trackIndex = findAvailableTrack(danmuData.type)
        if (trackIndex !== -1) {
          displayDanmu(danmuData, trackIndex)
          // 添加一个小延迟，确保同一轨道上的弹幕有足够的间距
          setTimeout(() => {
            processQueue()
          }, 180) // 设置180ms间隔，稍微加快节奏
        } else {
          // 没有可用轨道，将弹幕重新放回队列头部
          danmuQueue.value.unshift(danmuData)
        }
      }
    }
    
    // 查找可用的弹幕轨道
    const findAvailableTrack = (type) => {
      // 特殊弹幕倾向于使用屏幕中部轨道
      if (type === 'team' || type === 'success' || type === 'highlight') {
        const centralTracks = [
          Math.floor(TRACKS_COUNT * 0.4),
          Math.floor(TRACKS_COUNT * 0.5),
          Math.floor(TRACKS_COUNT * 0.6)
        ]
        const trackIndex = centralTracks[Math.floor(Math.random() * centralTracks.length)]
        
        // 检查最近是否使用过相同轨道
        const lastTrack = danmuContainer.value?.lastSpecialTrack
        if (trackIndex !== lastTrack || Math.random() > 0.7) {
          danmuContainer.value.lastSpecialTrack = trackIndex
          return trackIndex
        }
      }
      
      // 正常弹幕随机选择轨道
      const lastTrack = danmuContainer.value?.lastUsedTrack || -1
      let newTrack
      
      // 尝试寻找未被最近使用的轨道
      const recentTracks = danmuContainer.value?.recentTracks || []
      
      // 最多尝试10次
      for (let i = 0; i < 10; i++) {
        newTrack = Math.floor(Math.random() * TRACKS_COUNT)
        // 如果这个轨道最近没有被使用，就采用它
        if (!recentTracks.includes(newTrack)) {
          break
        }
      }
      
      // 更新最近使用的轨道记录
      if (!danmuContainer.value.recentTracks) {
        danmuContainer.value.recentTracks = []
      }
      
      danmuContainer.value.recentTracks.push(newTrack)
      // 只保留最近5个使用过的轨道记录
      if (danmuContainer.value.recentTracks.length > 5) {
        danmuContainer.value.recentTracks.shift()
      }
      
      danmuContainer.value.lastUsedTrack = newTrack
      return newTrack
    }
    
    // 实际显示弹幕
    const displayDanmu = (danmuData, trackIndex) => {
      if (!danmuContainer.value) {
        console.error('弹幕容器不存在')
        return
      }
      
      // 创建弹幕元素
      const danmu = document.createElement('div')
      
      // 设置弹幕基本样式
      danmu.className = `danmu danmu-${danmuData.type}`
      
      // 创建内容容器
      const contentSpan = document.createElement('span')
      contentSpan.className = 'danmu-content'
      contentSpan.textContent = `${danmuData.userName}：${danmuData.text}`
      danmu.appendChild(contentSpan)
      
      // 添加轨道属性
      danmu.setAttribute('data-track', trackIndex)
      
      // 添加点击事件关闭弹幕功能
      danmu.style.pointerEvents = 'auto'
      danmu.addEventListener('click', () => {
        // 点击弹幕时立即关闭所有弹幕
        if (danmuHook && danmuHook.updateDanmuConfig && danmuHook.danmuFrequency) {
          danmuHook.updateDanmuConfig({
            enabled: false,
            frequency: danmuHook.danmuFrequency.value || 1500
          });
        }
        
        // 立即清除所有弹幕，不等待watch触发
        if (danmuContainer.value) {
          const allDanmus = danmuContainer.value.querySelectorAll('.danmu');
          allDanmus.forEach(d => {
            if (d.parentNode) {
              d.parentNode.removeChild(d);
            }
          });
          
          // 重置计数和队列
          activeDanmuCount.value = 0;
          danmuQueue.value = [];
        }
      });
      
      // 判断弹幕类型
      const isSpecial = danmuData.type === 'team' || danmuData.type === 'success'
      const isHighlight = danmuData.type === 'highlight'
      
      // 根据轨道设置垂直位置 - 分布在整个屏幕上，但避开顶部和底部
      const trackStep = 85 / TRACKS_COUNT
      const top = 8 + trackStep * trackIndex + (Math.random() * trackStep * 0.3)
      
      // 获取随机颜色
      const colorSet = getRandomColor(danmuData.type)
      
      // 创建一个离屏容器进行渲染测量
      const offscreenContainer = document.createElement('div')
      offscreenContainer.style.position = 'absolute'
      offscreenContainer.style.visibility = 'hidden'
      offscreenContainer.style.left = '-9999px'
      offscreenContainer.style.whiteSpace = 'nowrap'
      offscreenContainer.style.padding = '6px 14px' // 与CSS中保持一致的内边距
      
      // 克隆弹幕内容进行宽度测量
      const testElement = contentSpan.cloneNode(true)
      offscreenContainer.appendChild(testElement)
      document.body.appendChild(offscreenContainer)
      
      // 获取内容宽度
      const contentWidth = testElement.offsetWidth
      
      // 移除测试元素
      document.body.removeChild(offscreenContainer)
      
      // 设置定位和样式属性 - 使用固定宽度避免换行问题
      danmu.style.position = 'fixed'
      danmu.style.top = `${top}%`
      danmu.style.left = '100%'
      danmu.style.whiteSpace = 'nowrap'
      danmu.style.backgroundColor = colorSet.bgColor
      danmu.style.borderColor = colorSet.border
      danmu.style.width = `${contentWidth + 28}px` // 内容宽度加上左右内边距，确保刚好包裹内容
      danmu.style.minWidth = 'fit-content'
      danmu.style.maxWidth = 'none'
      danmu.style.overflow = 'visible'
      danmu.style.display = 'inline-flex'
      danmu.style.alignItems = 'center'
      danmu.style.justifyContent = 'center'
      danmu.style.borderRadius = '18px'
      danmu.style.paddingLeft = '14px'
      danmu.style.paddingRight = '14px'
      
      // 特殊弹幕的缩放效果
      if (isSpecial || isHighlight) {
        const scale = 1 + (Math.random() * 0.1)
        danmu.style.transform = `translateY(-50%) scale(${scale})`
      } else {
        danmu.style.transform = 'translateY(-50%)'
      }
      
      // 增加活跃弹幕计数
      activeDanmuCount.value++
      
      // 添加到容器
      danmuContainer.value.appendChild(danmu)
      
      // 强制回流，确保元素已渲染
      danmu.offsetHeight
      
      // 计算随机动画时长
      const baseSpeed = isSpecial ? 12 : (isHighlight ? 9 : 8)
      const speedVariation = 0.8 + Math.random() * 0.4
      const animationDuration = baseSpeed * speedVariation
      
      // 为每条弹幕增加水平随机起始位置
      const horizontalOffset = Math.random() * 5
      danmu.style.left = `${100 + horizontalOffset}%`
      
      // 启动弹幕动画
      setTimeout(() => {
        if (isSpecial) {
          // 特殊弹幕：移动到屏幕中间，停留，然后移出屏幕
          danmu.style.transition = `left 3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 3s cubic-bezier(0.34, 1.56, 0.64, 1)`
          danmu.style.left = '50%'
          danmu.style.transform = `translateX(-50%) translateY(-50%) scale(1.05)`
          
          // 添加脉动效果
          danmu.classList.add('pulse-effect')
          
          // 在中间停留后移出屏幕
          setTimeout(() => {
            danmu.classList.remove('pulse-effect')
            danmu.style.transition = `left 3s cubic-bezier(0.5, 0, 0.75, 0), transform 3s ease`
            danmu.style.left = '-50%'
            danmu.style.transform = `translateX(-50%) translateY(-50%) scale(1)`
          }, 4000)
        } else if (isHighlight) {
          // 高亮弹幕：稍慢一些，有轻微的上下浮动效果
          danmu.style.transition = `left ${animationDuration}s cubic-bezier(0.25, 0.1, 0.25, 1), transform 3s ease`
          danmu.style.left = '-20%' // 移出屏幕左侧
          
          // 添加微小的浮动效果
          setTimeout(() => {
            danmu.style.transform = `translateY(-52%) scale(1.02)`
            
            setTimeout(() => {
              danmu.style.transform = `translateY(-48%) scale(1.02)`
              
              setTimeout(() => {
                danmu.style.transform = `translateY(-50%) scale(1)`
              }, 1000)
            }, 1000)
          }, 1000)
          
        } else {
          // 普通弹幕：从右到左移动，添加轻微的曲线运动
          danmu.style.transition = `left ${animationDuration}s cubic-bezier(0.25, 0.1, 0.25, 1), top 2.5s ease-in-out`
          danmu.style.left = '-20%' // 移出屏幕左侧
          
          // 在动画中途轻微改变垂直位置，形成微小的波浪效果
          const verticalShift = Math.random() > 0.5 ? 1 : -1
          
          setTimeout(() => {
            danmu.style.top = `${parseFloat(danmu.style.top) + verticalShift}%`
            
            setTimeout(() => {
              danmu.style.top = `${parseFloat(danmu.style.top) - verticalShift}%`
            }, 1500)
          }, 1200)
        }
      }, 10) // 减少延迟时间，确保尽快开始动画
      
      // 动画结束后移除
      setTimeout(() => {
        if (danmu && danmu.parentNode) {
          danmu.parentNode.removeChild(danmu)
          activeDanmuCount.value--
          processQueue()
        }
      }, animationDuration * 1000)
    }
    
    // 添加弹幕到队列
    const addToDanmuQueue = (options = {}) => {
      let messageType, userName, messageText
      
      // 如果提供了自定义选项，使用自定义选项
      if (options.type) {
        messageType = options.type
        userName = options.userName || generateRandomName()
        messageText = options.text || '发送了消息'
      } else {
        // 使用随机消息
        const messageIndex = Math.floor(Math.random() * danmuMessages.length)
        const message = danmuMessages[messageIndex]
        
        messageType = message.type
        userName = generateRandomName()
        messageText = message.text
      }
      
      // 添加到队列
      danmuQueue.value.push({
        type: messageType,
        userName: userName,
        text: messageText
      })
      
      // 处理队列，尝试显示弹幕
      processQueue()
    }
    
    // 开始弹幕动画
    const startDanmu = () => {
      console.log('开始弹幕动画')
      // 清除可能存在的旧定时器
      if (danmuInterval) {
        clearInterval(danmuInterval);
        danmuInterval = null;
      }
      
      // 判断hook是否已初始化
      if (!danmuHook || !danmuHook.danmuConfig || !danmuHook.danmuConfig.value) {
        console.error('弹幕Hook未正确初始化');
        return;
      }
      
      // 获取配置
      const danmuConfig = danmuHook.danmuConfig.value || { enabled: true, frequency: 1500 };
      
      // 如果弹幕已禁用，则不启动
      if (!danmuConfig.enabled) {
        console.log('弹幕已禁用，不启动')
        return;
      }
      
      console.log('弹幕已启用，频率:', danmuConfig.frequency)
      
      // 根据配置设置频率 - 更高频率产生更多弹幕
      const frequency = danmuConfig.frequency || 1000;
      
      // 立即添加几条弹幕，初始化时错开显示
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          addToDanmuQueue();
        }, i * 200);
      }
      
      // 每指定时间发送一条弹幕，加上随机延迟
      danmuInterval = setInterval(() => {
        // 再次检查hook状态，确保它在使用时仍然存在
        if (danmuHook && danmuHook.isDanmuEnabled && danmuHook.isDanmuEnabled.value) {
          // 随机批量添加1-3条弹幕
          const count = Math.random() > 0.5 ? (Math.random() > 0.5 ? 3 : 2) : 1;
          
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              addToDanmuQueue();
            }, i * 150);
          }
        }
      }, frequency + Math.floor(Math.random() * 200));
    }
    
    // 响应滚动同步事件 - 清除所有弹幕并重新开始
    const handleSyncScroll = () => {
      // 先清除所有弹幕
      if (danmuContainer.value) {
        const danmus = danmuContainer.value.querySelectorAll('.danmu')
        danmus.forEach(danmu => danmu.remove())
      }
      
      // 重置计数和队列
      activeDanmuCount.value = 0
      danmuQueue.value = []
      
      // 立即创建几条新弹幕
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          addToDanmuQueue()
        }, i * 300)
      }
    }
    
    // 监听特殊弹幕队列的变化
    watch(() => {
      // 添加空值检查
      if (!danmuHook || !danmuHook.specialDanmuList) {
        console.error('弹幕Hook未正确初始化，无法监听特殊弹幕队列');
        return [];
      }
      return danmuHook.specialDanmuList.value;
    }, (newDanmu, oldDanmu) => {
      // 如果新旧值为空，不处理
      if (!newDanmu || !oldDanmu) return;
      
      // 如果有新的特殊弹幕
      if (newDanmu.length > oldDanmu.length) {
        // 获取最新添加的弹幕
        const latestDanmu = newDanmu[newDanmu.length - 1];
        
        // 创建特殊弹幕 - 特殊弹幕优先显示，直接添加到队列头部
        danmuQueue.value.unshift({
          type: latestDanmu.type || 'highlight',
          userName: latestDanmu.userName,
          text: latestDanmu.text
        });
        
        // 尝试立即显示
        processQueue();
      }
    }, { deep: true });
    
    // 监听弹幕开关状态
    watch(() => {
      // 添加空值检查
      if (!danmuHook || !danmuHook.isDanmuEnabled) {
        console.error('弹幕Hook未正确初始化，无法监听弹幕开关状态');
        return false;
      }
      return danmuHook.isDanmuEnabled.value;
    }, (isEnabled) => {
      if (isEnabled) {
        startDanmu();
      } else {
        if (danmuInterval) {
          clearInterval(danmuInterval);
          danmuInterval = null;
        }
        
        // 清除所有现有弹幕 - 立即清除不使用淡出效果
        if (danmuContainer.value) {
          const danmus = danmuContainer.value.querySelectorAll('.danmu');
          danmus.forEach(danmu => {
            // 立即移除DOM元素
            if (danmu.parentNode) {
              danmu.parentNode.removeChild(danmu);
            }
          });
          
          // 立即重置计数和队列
          activeDanmuCount.value = 0;
          danmuQueue.value = [];
        }
      }
    }, { immediate: true });
    
    // 清除所有弹幕的函数
    const clearAllDanmu = () => {
      if (danmuContainer.value) {
        const allDanmus = danmuContainer.value.querySelectorAll('.danmu');
        allDanmus.forEach(d => {
          if (d.parentNode) {
            d.parentNode.removeChild(d);
          }
        });
        
        // 重置计数和队列
        activeDanmuCount.value = 0;
        danmuQueue.value = [];
      }
    }
    
    onMounted(() => {
      console.log('DanmuContainer 已挂载')
      // 确保组件挂载完成后立即启动弹幕
      startDanmu()
      
      // 监听滚动同步事件
      document.addEventListener('sync-scroll-pulse', handleSyncScroll)
      
      // 监听立即清除弹幕事件
      document.addEventListener('clear-all-danmu', clearAllDanmu)
    })
    
    onUnmounted(() => {
      if (danmuInterval) {
        clearInterval(danmuInterval)
      }
      
      // 移除事件监听
      document.removeEventListener('sync-scroll-pulse', handleSyncScroll)
      document.removeEventListener('clear-all-danmu', clearAllDanmu)
    })
    
    return {
      danmuContainer
    }
  }
}
</script>

<style scoped>
.danmu-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  overflow: visible;
}

.danmu {
  position: fixed;
  white-space: nowrap !important;
  padding: 6px 14px;
  border-radius: 18px;
  font-size: 14px;
  color: #ffffff;
  will-change: transform, left;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  backdrop-filter: blur(2px);
  z-index: 101;
  border: 1px solid #ffffff;
  letter-spacing: 0.5px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  overflow: visible;
  min-width: fit-content;
  max-width: none !important;
  font-weight: 500;
  transform: translateY(-50%);
  word-break: keep-all;
  width: auto !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
  background-color: rgba(0, 0, 0, 0.1) !important;
  border-radius: 18px !important;
  padding-left: 14px !important;
  padding-right: 14px !important;
  pointer-events: auto;
  cursor: pointer;
}

/* 弹幕内容容器 */
.danmu-content {
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap !important;
  max-width: none !important;
  width: auto !important;
  overflow: visible;
}

/* 高亮弹幕 */
.danmu-highlight {
  font-weight: 500;
  color: #ffffff;
}

/* 团队弹幕 */
.danmu-team {
  font-weight: 500;
  color: #ffffff;
}

/* 支付成功弹幕 */
.danmu-success {
  font-weight: 500;
  color: #ffffff;
}

/* 脉动效果 */
@keyframes pulse {
  0% { transform: translateX(-50%) translateY(-50%) scale(1.05); }
  50% { transform: translateX(-50%) translateY(-50%) scale(1.1); }
  100% { transform: translateX(-50%) translateY(-50%) scale(1.05); }
}

.pulse-effect {
  animation: pulse 1.5s infinite ease-in-out;
}
</style>