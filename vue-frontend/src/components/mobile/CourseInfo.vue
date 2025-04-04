<template>
  <div class="course-info">
    <div class="section-title">
      <div class="title-line"></div>
      <h2>课程介绍</h2>
      <div class="title-line"></div>
    </div>
    
    <div class="content">
      <h3>武道开学计划</h3>
      <p class="course-description">
        本课程致力于传授传统武术精髓，融合现代教育理念，培养学员的身体素质、心理素质和武德修养。
        适合各年龄段学员参与，无需武术基础，由专业教练团队指导。
      </p>
      
      <div class="features">
        <div class="feature-item">
          <div class="icon">🥋</div>
          <div class="feature-title">专业教学</div>
          <div class="feature-desc">资深教练团队授课，保证教学质量</div>
        </div>
        
        <div class="feature-item">
          <div class="icon">⏱️</div>
          <div class="feature-title">灵活课时</div>
          <div class="feature-desc">每周多个时段可选，满足不同学员需求</div>
        </div>
        
        <div class="feature-item">
          <div class="icon">🏆</div>
          <div class="feature-title">系统评估</div>
          <div class="feature-desc">定期技能评估，了解学习进度</div>
        </div>
      </div>
      
      <div class="schedule">
        <h4>课程安排</h4>
        <div class="schedule-table-container">
          <div class="schedule-table">
            <div class="schedule-row">
              <div class="schedule-cell">时间</div>
              <div class="schedule-cell">内容</div>
              <div class="schedule-cell">地点</div>
            </div>
            <div class="schedule-row">
              <div class="schedule-cell">周一 18:30-20:00</div>
              <div class="schedule-cell">基础训练</div>
              <div class="schedule-cell">主道馆</div>
            </div>
            <div class="schedule-row">
              <div class="schedule-cell">周三 18:30-20:00</div>
              <div class="schedule-cell">技击训练</div>
              <div class="schedule-cell">主道馆</div>
            </div>
            <div class="schedule-row">
              <div class="schedule-cell">周六 10:00-12:00</div>
              <div class="schedule-cell">形意拳法</div>
              <div class="schedule-cell">户外训练场</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CourseInfo'
}
</script>

<style scoped>
.course-info {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.title-line {
  height: 1px;
  width: 50px;
  background: linear-gradient(to right, transparent, #e53935, transparent);
  margin: 0 10px;
}

h2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

h3 {
  font-size: 16px;
  color: #e53935;
  margin-bottom: 10px;
  text-align: center;
}

h4 {
  font-size: 15px;
  color: #333;
  margin: 15px 0 10px;
}

.course-description {
  line-height: 1.6;
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.features {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.feature-item {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin: 0 5px;
  min-width: 90px;
}

.icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.feature-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
  color: #333;
}

.feature-desc {
  font-size: 12px;
  color: #666;
}

.schedule-table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.schedule-table {
  width: 100%;
  border-radius: 5px;
  overflow: hidden;
  font-size: 13px;
  min-width: 300px;
}

.schedule-row {
  display: flex;
  border-bottom: 1px solid #eee;
}

.schedule-row:last-child {
  border-bottom: none;
}

.schedule-row:first-child {
  background-color: #f5f5f5;
  font-weight: bold;
}

.schedule-cell {
  flex: 1;
  padding: 8px;
  text-align: center;
}

/* 移动端响应式设计 */
@media screen and (max-width: 768px) {
  .features {
    flex-direction: column;
  }
  
  .feature-item {
    margin: 5px 0;
    width: 100%;
  }
  
  .schedule-cell {
    font-size: 12px;
    padding: 6px 4px;
  }
  
  .schedule-row:first-child .schedule-cell {
    font-size: 13px;
  }
}

/* 超小屏幕手机优化 */
@media screen and (max-width: 375px) {
  .course-info {
    padding: 10px;
  }
  
  h2 {
    font-size: 16px;
  }
  
  h3 {
    font-size: 15px;
  }
  
  .course-description {
    font-size: 13px;
  }
  
  .title-line {
    width: 30px;
  }
}
</style> 