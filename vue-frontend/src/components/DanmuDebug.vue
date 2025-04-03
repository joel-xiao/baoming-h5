<template>
  <div style="display: none;"></div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'DanmuDebug',
  setup() {
    const store = useStore()
    
    // 始终返回false，禁用调试功能
    const isDebugMode = computed(() => {
      return false
    })
    
    // 随机姓名生成
    const randomNames = [
      '张三', '李四', '王五', '赵六', 
      '刘晓明', '周小红', '吴小龙', '孙小琳',
      '陈小刚', '林小丽', '郑小梅', '钱小帅'
    ]
    
    // 生成随机名字
    const getRandomName = () => {
      return randomNames[Math.floor(Math.random() * randomNames.length)]
    }
    
    // 保留原有方法但不会被调用
    const triggerRandomDanmu = () => {}
    const triggerJoinTeamDanmu = () => {}
    const triggerLeaderDanmu = () => {}
    const triggerPaymentDanmu = () => {}
    
    return {
      isDebugMode,
      triggerRandomDanmu,
      triggerJoinTeamDanmu,
      triggerLeaderDanmu,
      triggerPaymentDanmu
    }
  }
}
</script>

<style scoped>
/* 移除调试样式 */
</style> 