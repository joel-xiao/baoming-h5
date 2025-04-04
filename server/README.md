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

## API接口列表

完整API文档请参考项目根目录的 [API文档.md](../API文档.md)。

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
| `/payment/notify/wechat` | POST | 微信支付回调接口 |
| `/payment/notify/alipay` | POST | 支付宝回调接口 |
| `/payment/status/:id` | GET | 查询支付状态 |

### 管理员接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/admin/registrations` | GET | 获取报名记录列表 |
| `/admin/export/registrations` | GET | 导出报名数据 |
| `/admin/dashboard` | GET | 获取统计数据 |
| `/admin/config` | GET/PUT | 系统配置管理 |

## 项目结构

```
server/
├── config/             # 配置文件
│   ├── app.js          # 应用配置
│   └── database.js     # 数据库配置
├── src/                # 源代码
│   ├── api/            # API相关
│   │   ├── controllers/  # 控制器
│   │   ├── middlewares/  # 中间件
│   │   ├── routes/       # 路由
│   │   └── validators/   # 验证器
│   ├── core/           # 核心模块
│   │   ├── db/           # 数据库相关
│   │   │   ├── models/     # 数据模型
│   │   │   ├── Database.js # 数据库连接
│   │   │   └── SchemaBuilder.js # 模式构建器
│   │   ├── services/    # 业务服务
│   │   └── utils/       # 工具函数
│   │       ├── Logger.js   # 日志工具
│   │       ├── Payment.js  # 支付工具
│   │       └── Email.js    # 邮件工具
│   └── app.js          # 应用主入口
├── logs/               # 日志文件
├── uploads/            # 上传文件目录
├── data/               # 文件系统存储数据 (如果使用)
└── package.json        # 项目依赖
```

## 开发指南

1. **添加新模型**

```javascript
// src/core/db/models/NewModel.js
const { SchemaBuilder } = require('../SchemaBuilder');

const fields = {
  name: { type: 'string', required: true },
  description: { type: 'string' },
  active: { type: 'boolean', default: true },
  createdAt: { type: 'date', default: Date.now }
};

module.exports = SchemaBuilder.createModel('NewModel', fields);
```

2. **创建新的控制器**

```javascript
// src/api/controllers/newController.js
const { NewModel } = require('../../core/db/models');
const { DataAccess } = require('../../core/db/DataAccess');
const logger = require('../../core/utils/Logger');

const dataAccess = new DataAccess(NewModel);

// 获取所有记录
const getAllItems = async (req, res) => {
  try {
    const items = await dataAccess.find();
    res.status(200).json({
      success: true,
      message: '获取数据成功',
      data: items
    });
  } catch (error) {
    logger.error(`获取数据错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取数据时发生错误'
    });
  }
};

module.exports = {
  getAllItems
};
```

3. **添加新的路由**

```javascript
// src/api/routes/newRoutes.js
const express = require('express');
const newController = require('../controllers/newController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// 公开路由
router.get('/public', newController.getPublicItems);

// 需要认证的路由
router.get('/private', authMiddleware, newController.getPrivateItems);

module.exports = router;
```

4. **注册路由**

```javascript
// src/api/routes/index.js
const express = require('express');
const newRoutes = require('./newRoutes');

const router = express.Router();

// 添加新路由
router.use('/new', newRoutes);

module.exports = router;
```

## 错误处理

系统使用统一的错误处理中间件：

```javascript
// src/api/middlewares/errorMiddleware.js
const logger = require('../../core/utils/Logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  logger.error(`错误: ${message}, 状态码: ${statusCode}`);
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
```

## 安全措施

1. **JWT认证**：使用JWT进行API认证
2. **请求验证**：使用Joi/Express Validator验证请求参数
3. **限流**：对敏感API实施请求限制
4. **CORS配置**：限制跨域请求
5. **Helmet**：设置安全HTTP头部

## 性能优化

1. **数据库索引**：为常用查询字段创建索引
2. **请求缓存**：使用内存缓存减少数据库查询
3. **压缩**：使用compression中间件压缩响应
4. **请求合并**：使用Promise.all并行处理多个异步操作

## 代码规范

- 使用async/await处理异步操作
- 使用统一的错误处理流程
- 遵循RESTful API设计原则
- 保持代码注释完整
