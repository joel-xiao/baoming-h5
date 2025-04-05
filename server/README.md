# 团队报名系统服务端

本项目是团队报名系统的服务端部分，提供了完整的API接口支持报名、支付等功能。

## 特点

- 支持多种数据库：MongoDB (默认)、MySQL、文件系统存储
- 领域驱动设计(DDD)架构，提高代码可维护性和可扩展性
- 完善的子领域划分，支持业务的独立扩展
- RESTful API设计
- 完善的日志系统
- 管理员权限控制

## 架构说明

本项目采用领域驱动设计(DDD)架构，将系统划分为多个业务领域：
- 账户领域（Account Domain）
- 注册领域（Registration Domain）
- 支付领域（Payment Domain）
- 统计领域（Statistics Domain）

每个领域都有明确的边界和职责，并可以进一步划分为子领域。详细的架构说明请参考：
- [项目文档目录](docs/README.md) - 所有项目文档的索引
- [DDD架构设计指南](docs/架构设计/DDD架构设计指南.md) - 领域驱动设计实施指南
- [项目结构说明](docs/架构设计/项目结构说明.md) - 项目目录结构详细说明

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

可以通过设置环境变量 `DB_TYPE` 来切换存储类型。

## 主要功能

### 报名相关功能

- 团队报名管理
- 个人报名管理
- 报名表单验证
- 邮件通知

### 支付相关功能

- 微信支付集成
- 支付宝支付集成
- 支付状态查询
- 退款处理

### 管理功能

- 用户认证与授权
- 报名数据管理
- 数据统计和导出
- 系统配置管理

## 文档

所有项目文档都位于 [docs](docs) 目录下，包括：

- [架构设计文档](docs/架构设计)
- [部署文档](docs/部署文档)
- [测试文档](docs/测试文档)

## 贡献指南

请参考 [DDD架构设计指南](docs/架构设计/DDD架构设计指南.md) 了解项目架构和代码规范。
