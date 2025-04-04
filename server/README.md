# 团队报名系统服务端

本项目是团队报名系统的服务端部分，提供了完整的API接口支持报名、支付等功能。

## 特点

- 支持多种数据库：MongoDB (默认)、MySQL、文件系统存储
- 通用数据访问层，无需在业务代码中处理数据库差异
- 统一字段定义，自动生成各种数据库模型
- RESTful API设计
- 完善的日志系统
- 管理员权限控制

## 安装

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产环境运行
npm start
```

## 环境变量配置

在项目根目录创建 `.env` 文件，示例配置如下：

```
# 服务器配置
PORT=3000
NODE_ENV=development

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/baoming

# MySQL 配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DB=baoming

# 数据存储类型: mongodb, mysql 或 filesystem
DB_TYPE=mongodb

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 日志配置
LOG_LEVEL=info
```

## 数据库选择

本项目支持三种数据存储方式：

1. **MongoDB** (默认): 适合快速开发和灵活的数据结构
2. **MySQL**: 适合关系型数据场景
3. **文件系统**: 作为备用方案，不需要安装数据库

可以通过设置环境变量 `DB_TYPE` 来切换存储类型：
- `mongodb`: 使用 MongoDB (默认)
- `mysql`: 使用 MySQL
- `filesystem`: 使用文件系统存储

## 数据层架构

本项目采用了三层架构来处理数据：

1. **模型层**：使用 SchemaBuilder 从统一字段定义生成不同数据库的模型
   ```javascript
   // 统一字段定义
   const fields = {
     name: { type: 'string', required: true },
     age: { type: 'number', min: 0 }
   };
   
   // 自动生成所有数据库的模型
   const User = SchemaBuilder.createModel('User', fields);
   ```

2. **数据访问层**：DataAccess 封装了对不同数据库的操作
   ```javascript
   const userDA = new DataAccess(User);
   const user = await userDA.findOne({ name: 'Zhang San' });
   ```

3. **服务层**：专注于业务逻辑，不需要处理数据库差异
   ```javascript
   class UserService {
     constructor() {
       this.userDA = new DataAccess(User);
     }
     
     async getUserByName(name) {
       return this.userDA.findOne({ name });
     }
   }
   ```

这种架构的优点：
- 业务代码更加简洁，专注于业务逻辑
- 轻松切换不同数据库，无需修改业务代码
- 集中处理数据库操作，便于统一错误处理和日志记录
- 字段定义只需要一次，自动适配不同数据库

## API文档

API基础URL: `/api`

### 报名相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/registration` | GET | 获取最近报名记录 |
| `/registration/leader` | POST | 创建队长预报名 |
| `/registration/join` | POST | 加入已有团队 |
| `/registration/team/:teamId` | GET | 获取团队成员列表 |

### 支付相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/payment/create` | POST | 创建支付订单 |
| `/payment/notify` | POST | 支付回调接口 |
| `/payment/status/:orderNo` | GET | 查询支付状态 |

### 管理员接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/payment/admin/orders` | GET | 获取支付订单列表 |
| `/admin/registrations` | GET | 获取报名记录列表 |
| `/admin/stats` | GET | 获取统计数据 |
| `/admin/export` | GET | 导出报名数据 |

### 时间相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/time/server-time` | GET | 获取服务器时间 |

## 项目结构

```
server/
├── config/             # 配置文件
├── controllers/        # 控制器
├── middleware/         # 中间件
├── models/             # 数据模型
├── routes/             # 路由
├── services/           # 业务逻辑
├── utils/              # 工具函数
│   ├── dataAccess.js   # 数据访问层
│   ├── schemaBuilder.js # 模式构建器
│   ├── modelFactory.js # 模型工厂
│   ├── fileStorage.js  # 文件系统存储
│   ├── logger.js       # 日志工具
│   └── response.js     # 响应工具
├── data/               # 文件系统存储数据 (如果使用)
├── logs/               # 日志文件
├── app.js              # 应用主入口
└── package.json        # 项目依赖
```

## 开发指南

1. 添加新模型时，使用 SchemaBuilder 和统一字段定义
2. 服务层应使用 DataAccess 而不是直接操作模型
3. 修改 DataAccess 类时需确保兼容所有数据库类型
4. 敏感操作需要添加管理员权限验证
