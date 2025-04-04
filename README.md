# 团队报名管理平台

## 项目概述

这是一个专为团队集体报名场景设计的在线管理平台，支持成员报名、在线支付和数据统计。系统采用前后端分离架构，适合各类培训课程、赛事活动、集体活动等场景使用。

主要特点：
- 团队组织模式（队长创建团队，队员加入）
- 集成支付功能
- 管理后台数据统计
- 断网时本地存储保障

## 技术栈

- **前端**：Vue.js 3 + Vue Router + Vuex
- **后端**：Node.js + Express
- **数据库**：MongoDB
- **第三方服务**：支付API接入

## 快速开始

### 环境要求

- Node.js v14+
- MongoDB v4.4+

### Linux环境部署

1. **安装MongoDB**

   ```bash
   # 进入项目bin目录
   cd bin
   
   # 赋予脚本执行权限
   chmod +x install_mongodb.sh
   
   # 以管理员权限执行安装脚本
   sudo ./install_mongodb.sh
   ```

2. **安装Node.js**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **部署系统**

   ```bash
   git clone <项目仓库URL> baoming
   cd baoming
   npm install
   npm start
   ```

### Windows环境部署

1. 下载并安装 [MongoDB](https://www.mongodb.com/try/download/community)
2. 下载并安装 [Node.js](https://nodejs.org/)
3. 获取项目代码
4. 安装依赖并启动
   ```
   npm install
   npm start
   ```

## 系统配置

系统采用前后端分离架构，配置也相应分为前端配置和后端配置。

### 后端配置

后端配置主要通过环境变量实现，在根目录创建`.env`文件：

```
PORT=3001
DB_URI=mongodb://localhost:27017/team_registration
PAYMENT_PROVIDER=wechat
PAYMENT_APP_ID=your_app_id_here
PAYMENT_MCH_ID=your_merchant_id_here
PAYMENT_NOTIFY_URL=https://yourdomain.com/api/payment/notify
JWT_SECRET=your_jwt_secret_key_here
```

### 前端配置

前端配置使用环境变量方式，在构建时注入：

1. 复制 `vue-frontend/.env.example` 为 `vue-frontend/.env.local`
2. 根据需要修改配置值

```
# API基础URL
VUE_APP_API_URL=http://localhost:3001/api

# 项目配置
VUE_APP_TITLE=团队报名平台

# 特性开关
VUE_APP_FEATURE_OFFLINE_STORAGE=true
```

## 主要功能

### 学员端功能

- **在线报名**：学员填写并提交报名信息
- **团队报名**：支持队长创建团队，团队成员加入
- **微信支付**：便捷完成学费缴纳
- **报名查询**：查询个人报名状态及团队成员信息

### 管理端功能

- **报名管理**：查看、筛选报名记录
- **订单管理**：查看支付订单记录
- **数据统计**：统计报名人数、支付金额等数据
- **数据导出**：导出报名数据为CSV文件

## API接口

系统提供完整的REST API接口：

### 接口列表

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/registration` | GET | 获取最近报名记录 |
| `/api/registration/leader` | POST | 创建队长预报名 |
| `/api/registration/join` | POST | 加入已有团队 |
| `/api/payment/create` | POST | 创建支付订单 |
| `/api/admin/stats` | GET | 获取统计数据 |

更多接口详情请参考 [API文档](./API文档.md)

## 示例调用

```javascript
// 创建队长报名
async function createLeader(data) {
  try {
    const response = await axios.post('/api/registration/leader', data);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('API调用错误:', error);
    return null;
  }
}
```

## 系统维护

### 数据备份

```bash
# 备份数据库
mongodump --db baoming --out ~/backup/
```

### 系统更新

```bash
# 获取最新代码并重启
git pull
npm install
npm restart
```

## 常见问题

1. **MongoDB连接失败**：检查MongoDB服务是否正常运行
2. **端口冲突**：修改`.env`中的PORT值
3. **前端无法访问**：确认前端构建是否成功

## 文档

- [项目介绍](./项目介绍.md) - 详细介绍项目架构与功能
- [项目部署指南](./项目部署指南.md) - 完整的部署文档
- [API文档](./API文档.md) - API接口文档

## 开源协议

MIT 