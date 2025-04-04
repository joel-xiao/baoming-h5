<template>
  <div class="header">
    <h1>尚博武道 "开学钜惠"</h1>
    <p class="subtitle">99元抢购24次课</p>
  </div>
  
  <!-- 音乐图标容器，固定在右上角 -->
  <div class="music-icon-container">
    <!-- 音乐图标，支持旋转 -->
    <div class="music-icon-fixed" 
         :class="{ playing: isPlaying }" 
         @click="toggleMusic"
         @touchstart.prevent="handleTouchStart"
         @touchend.prevent="handleTouchEnd">
      <i class="iconfont" :class="isPlaying ? 'icon-yinle' : 'icon-yinliang-jingyin'"></i>
      <!-- 备用图标，当iconfont加载失败时显示 -->
      <div class="backup-icon" ref="backupIcon"></div>
    </div>
    <!-- 状态提示，不随图标旋转 -->
    <div class="music-status" v-if="showStatus">{{ getMusicStatusText() }}</div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'

export default {
  name: 'HeaderComponent',
  setup() {
    const isPlaying = ref(false)
    const backupIcon = ref(null)
    const showStatus = ref(false)
    let statusTimer = null
    let touchStartTime = 0
    
    // 处理触摸开始事件
    const handleTouchStart = (e) => {
      touchStartTime = Date.now()
    }
    
    // 处理触摸结束事件
    const handleTouchEnd = (e) => {
      // 如果触摸时间小于300ms，视为点击
      if (Date.now() - touchStartTime < 300) {
        toggleMusic()
      }
    }
    
    // 获取音乐状态提示文字
    const getMusicStatusText = () => {
      const bgm = document.getElementById('bgm')
      if (!bgm) return '初始化中...'
      
      if (bgm.paused) return '音乐已暂停'
      if (bgm.muted) return '静音模式'
      return '音乐播放中'
    }
    
    // 检查音乐播放状态并更新图标状态
    const checkMusicStatus = () => {
      const bgm = document.getElementById('bgm')
      if (bgm) {
        // 只有当音乐在播放且未静音时，图标才显示为播放状态
        isPlaying.value = !bgm.paused && !bgm.muted
      }
    }
    
    // 切换音乐状态
    const toggleMusic = () => {
      const bgm = document.getElementById('bgm')
      if (!bgm) return
      
      // 对于播放/暂停状态的处理
      if (bgm.paused) {
        // 如果是暂停状态，则播放
        try {
          // 先设置音量和取消静音
          bgm.volume = 0.5
          bgm.muted = false
          
          const playPromise = bgm.play()
          if (playPromise !== undefined) {
            playPromise.then(() => {
              isPlaying.value = true
              showStatusMessage()
            }).catch(err => {
              showStatus.value = true
              statusTimer = setTimeout(() => {
                showStatus.value = false
              }, 2000)
            })
          }
        } catch (error) {
          console.error('播放音乐时出错:', error)
        }
      } else {
        // 如果正在播放，检查是否静音
        if (bgm.muted) {
          // 如果是静音状态，则取消静音
          bgm.muted = false
          isPlaying.value = true
          showStatusMessage()
        } else {
          // 如果不是静音状态，则暂停播放
          try {
            bgm.pause()
            isPlaying.value = false
            showStatusMessage()
          } catch (error) {
            console.error('暂停音乐时出错:', error)
          }
        }
      }
    }
    
    // 显示状态消息
    const showStatusMessage = () => {
      showStatus.value = true
      
      // 清除之前的定时器
      if (statusTimer) {
        clearTimeout(statusTimer)
      }
      
      // 2秒后隐藏消息
      statusTimer = setTimeout(() => {
        showStatus.value = false
      }, 2000)
    }
    
    // 监听音频播放状态变化
    const handleAudioPlay = () => {
      setTimeout(() => {
        const bgm = document.getElementById('bgm')
        if (bgm && !bgm.muted) {
          isPlaying.value = true
        }
      }, 50)
    }
    
    const handleAudioPause = () => {
      isPlaying.value = false
    }
    
    // 定期检查音乐状态
    const startMusicStatusChecker = () => {
      // 每秒检查一次音乐状态
      const intervalId = setInterval(checkMusicStatus, 1000)
      
      return () => {
        clearInterval(intervalId)
      }
    }
    
    // 检查iconfont是否正确加载，否则使用备用图标
    const checkIconFont = () => {
      // 尝试检查图标字体是否已加载
      const testElement = document.createElement('i')
      testElement.className = 'iconfont icon-yinle'
      testElement.style.position = 'absolute'
      testElement.style.left = '-9999px'
      document.body.appendChild(testElement)
      
      const computedStyle = window.getComputedStyle(testElement, '::before')
      const contentValue = computedStyle.getPropertyValue('content')
      document.body.removeChild(testElement)
      
      // 如果图标字体未正确加载，使用备用SVG图标
      if (contentValue === 'none' || contentValue === '' || contentValue === 'normal') {
        if (backupIcon.value) {
          backupIcon.value.style.display = 'block'
          // 根据播放状态选择不同的备用图标
          updateBackupIcon()
        }
      }
    }
    
    // 更新备用图标
    const updateBackupIcon = () => {
      if (!backupIcon.value) return
      
      if (isPlaying.value) {
        backupIcon.value.style.backgroundImage = 'url(/audio/music-icon.svg)'
      } else {
        backupIcon.value.style.backgroundImage = 'url(/audio/music-icon-mute.svg)'
      }
    }
    
    // 监听播放状态变化，更新备用图标
    watchEffect(() => {
      if (backupIcon.value && backupIcon.value.style.display === 'block') {
        updateBackupIcon()
      }
    })
    
    onMounted(() => {
      // 初始化时检查音乐状态
      setTimeout(checkMusicStatus, 500)
      
      // 监听音频事件
      const bgm = document.getElementById('bgm')
      if (bgm) {
        bgm.addEventListener('play', handleAudioPlay)
        bgm.addEventListener('pause', handleAudioPause)
        
        // 如果音频已经开始播放，更新状态
        if (!bgm.paused && !bgm.muted) {
          isPlaying.value = true
        }
      }
      
      // 开始音乐状态检查器
      const stopChecker = startMusicStatusChecker()
      
      // 检查iconfont是否加载，延迟检查确保有足够时间加载
      setTimeout(checkIconFont, 1000)
      
      // 组件卸载时停止检查
      onUnmounted(() => {
        stopChecker()
      })
    })
    
    onUnmounted(() => {
      // 移除事件监听器
      const bgm = document.getElementById('bgm')
      if (bgm) {
        bgm.removeEventListener('play', handleAudioPlay)
        bgm.removeEventListener('pause', handleAudioPause)
      }
      
      // 清除定时器
      if (statusTimer) {
        clearTimeout(statusTimer)
      }
    })
    
    return {
      isPlaying,
      toggleMusic,
      backupIcon,
      showStatus,
      getMusicStatusText,
      handleTouchStart,
      handleTouchEnd
    }
  }
}
</script>

<style scoped>
/* 音乐图标容器 */
.music-icon-container {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* 音乐图标 */
.music-icon-fixed {
  width: 44px;
  height: 44px;
  background-color: rgba(229, 57, 53, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: transform 0.3s ease, background-color 0.3s ease;
  -webkit-tap-highlight-color: transparent; /* 移除移动设备上的点击高亮 */
  touch-action: manipulation; /* 优化触摸操作 */
}

.music-icon-fixed:hover {
  transform: scale(1.1);
  background-color: rgba(229, 57, 53, 0.8);
}

.music-icon-fixed:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}

.music-icon-fixed i {
  font-size: 24px;
  color: white;
}

.backup-icon {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 60%;
  background-position: center;
  background-repeat: no-repeat;
}

/* 状态提示 - 独立于音乐图标，不会跟随旋转 */
.music-status {
  position: absolute;
  top: 50px;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  animation: fade-in-out 2s ease;
  pointer-events: none;
}

@keyframes fade-in-out {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

/* 只旋转图标，而不是整个容器 */
.music-icon-fixed.playing {
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 修复旋转时的缩放效果 */
.music-icon-fixed.playing:hover {
  animation: rotate 3s linear infinite, enlarge 0.3s forwards;
}

.music-icon-fixed.playing:active {
  animation: rotate 3s linear infinite;
  transform: scale(0.95);
}

@keyframes enlarge {
  to {
    transform: scale(1.1) rotate(0deg);
  }
}
</style> 