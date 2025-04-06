# 团队报名系统服务端

本项目是团队报名系统的服务端部分，基于Express框架和DDD架构开发。

## 项目结构

```
src/
├── app.js               # 应用入口
├── domains/             # 领域层
│   ├── BaseService.js   # 服务基类
│   └── account/         # 账户领域
├── infrastructure/      # 基础设施层
└── config/              # 配置文件
```

## 已实现功能

- 基础架构搭建，采用Express框架
- 依赖注入系统，使用容器管理服务实例
- 账户领域基本功能
- 性能监控中间件
- 错误处理机制
- 健康检查端点

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产环境运行
npm start
```

## 环境变量配置

在项目根目录创建 `.env` 文件，配置示例：

```
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/baoming
DB_TYPE=mongodb  # 支持: mongodb, mysql, filesystem

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 日志配置
LOG_LEVEL=info
```

## 文档

项目文档请参见 [docs](docs) 目录，包括：

- [项目结构说明](docs/架构设计/项目结构说明.md)
- [DDD架构设计指南](docs/架构设计/DDD架构设计指南.md)
- [服务依赖注入模式](docs/架构设计/服务依赖注入模式.md)
