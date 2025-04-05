# 领域驱动设计(DDD)架构指南与项目结构说明

## 概述

本文档旨在为团队报名系统服务端提供领域驱动设计(DDD)的实施指南和项目结构说明，帮助开发团队理解和应用DDD原则，确保代码的一致性和可维护性。

## DDD基本概念

### 战略设计

1. **领域(Domain)**：业务逻辑的主要区域，如账户、注册、支付、统计等。

2. **子领域(Subdomain)**：领域内的特定业务区域，如支付领域下的微信支付和支付宝支付子领域。

3. **限界上下文(Bounded Context)**：在我们的实现中，每个领域及其子领域形成独立的限界上下文，有自己的模型和规则。

4. **通用语言(Ubiquitous Language)**：团队和业务专家共同使用的语言，应反映在代码中。

### 战术设计

1. **实体(Entity)**：具有唯一标识的对象，如`Registration`、`Payment`等。

2. **值对象(Value Object)**：没有唯一标识的对象，如支付请求参数、注册表单等。

3. **聚合(Aggregate)**：一组相关对象的集合，以聚合根为入口。

4. **领域服务(Domain Service)**：处理不属于任何实体的业务逻辑。

5. **仓储(Repository)**：提供访问聚合的接口。

## 项目结构说明

本项目采用领域驱动设计(DDD)的思想，以业务领域为中心组织代码，提高可维护性和可扩展性。

### 主要目录

- **/domains**: 业务领域目录，包含所有业务逻辑
  - **/account**: 账户领域
    - **/subdomains/auth**: 认证子领域，处理登录、认证等功能
    - **/subdomains/admin**: 管理员子领域，处理管理员管理、数据导出等功能
  - **/registration**: 报名领域
  - **/payment**: 支付领域
    - **/subdomains/wechat**: 微信支付子领域
    - **/subdomains/alipay**: 支付宝支付子领域
  - **/statistics**: 统计领域

- **/infrastructure**: 基础设施层，提供技术支持
  - **/database**: 数据库相关
  - **/storage**: 存储相关
  - **/security**: 安全相关
  - **/communication**: 通信相关
  - **/integration**: 外部集成
  - **/utils**: 通用工具
  - **/middleware**: 中间件
  - **/scheduler**: 任务调度

- **/lib**: 内部库
  - **/common**: 
  - **/extensions**: 扩展功能

- **/scripts**: 脚本工具

### 领域目录结构

每个业务领域（如account、registration等）都遵循以下结构：

```
/domain                  # 领域目录
  /models                # 领域模型
    Entity.js            # 实体
    ValueObject.js       # 值对象
  /services              # 领域服务
  /repositories          # 仓储接口
  /controllers           # 控制器
  /subdomains            # 子领域
    /subdomain           # 具体子领域
      /models            # 子领域模型
      /services          # 子领域服务
      /controllers       # 子领域控制器
  /routes.js             # 领域路由
  /index.js              # 领域入口
```

## 已实现的子领域说明

### 账户领域 (Account Domain)

账户领域包含两个子领域：

1. **认证子领域 (Auth Subdomain)**
   - 服务：`AuthService` - 处理用户认证、登录、令牌管理等功能
   - 控制器：`authController` - 处理认证相关的API请求
   - 主要功能：
     - 用户登录
     - 令牌刷新
     - 密码管理
     - 密码重置

2. **管理员子领域 (Admin Subdomain)**
   - 服务：`AdminService` - 处理管理员管理、数据导出、统计等功能
   - 控制器：`adminController` - 处理管理员相关的API请求
   - 主要功能：
     - 管理员用户管理
     - 报名数据查询与导出
     - 支付数据导出
     - 统计数据生成

### 支付领域 (Payment Domain)

支付领域包含两个子领域：

1. **微信支付子领域 (WeChat Subdomain)**
   - 服务：`WechatPaymentService` - 处理微信支付相关的业务逻辑
   - 控制器：`wechatPaymentController` - 处理微信支付相关的API请求
   - 主要功能：
     - 微信支付订单创建
     - 支付回调处理
     - 订单查询
     - 退款处理

2. **支付宝支付子领域 (Alipay Subdomain)**
   - 服务：`AlipayService` - 处理支付宝支付相关的业务逻辑
   - 控制器：`alipayController` - 处理支付宝支付相关的API请求
   - 主要功能：
     - 支付宝支付订单创建
     - 支付回调处理
     - 订单查询
     - 退款处理

### 注册领域 (Registration Domain)

- 包含团队和个人报名子领域
- 主要实体：`Registration`
- 主要服务：`RegistrationService`
- 子领域服务：`TeamService`、`IndividualService`

### 统计领域 (Statistics Domain)

- 主要实体：`Statistics`
- 主要服务：`StatisticsService`
- 依赖其他领域的数据

## 代码组织原则

1. **领域边界**：
   - 尽量避免跨领域直接调用
   - 领域间通信通过领域服务的公共接口进行
   - 避免领域模型的泄漏

2. **依赖方向**：
   - 业务领域可以依赖基础设施层
   - 基础设施层不应依赖业务领域
   - 子领域可以依赖其所属的主领域

3. **模型定义**：
   - 每个领域的模型应在其models目录中定义
   - 模型应包含字段定义和基本验证逻辑
   - 模型应反映业务概念
   - 避免模型成为无逻辑的数据容器

4. **服务职责**：
   - 服务应专注于特定业务逻辑
   - 避免创建"万能"服务

5. **控制器简洁性**：
   - 控制器应仅处理请求/响应逻辑
   - 业务逻辑应委托给服务层处理
   - 参数验证和转换
   - 调用领域服务
   - 处理响应和错误

6. **仓储责任**：
   - 数据持久化和检索
   - 不包含业务逻辑

## 实现指南

### 模型实现

```javascript
// 实体示例 - Registration.js
class Registration {
  constructor(data) {
    this.id = data.id;
    this.teamName = data.teamName;
    this.leader = data.leader;
    this.members = data.members || [];
    this.status = data.status;
    this.createdAt = data.createdAt || new Date();
  }

  // 领域逻辑
  addMember(member) {
    // 业务规则: 检查成员是否已存在
    if (this.members.some(m => m.phone === member.phone)) {
      throw new Error('成员已存在');
    }
    
    this.members.push(member);
    return this;
  }

  // 业务规则验证
  validate() {
    if (!this.teamName) {
      return { isValid: false, errors: ['团队名称不能为空'] };
    }
    
    if (!this.leader || !this.leader.name || !this.leader.phone) {
      return { isValid: false, errors: ['领队信息不完整'] };
    }
    
    return { isValid: true, errors: [] };
  }
}
```

### 服务实现

```javascript
// 领域服务示例 - RegistrationService.js
class RegistrationService {
  constructor(registrationRepository) {
    this.registrationRepository = registrationRepository;
  }

  async createRegistration(registrationData) {
    // 创建实体
    const registration = new Registration(registrationData);
    
    // 验证
    const validationResult = registration.validate();
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '));
    }
    
    // 业务规则: 检查领队手机号是否已存在
    const existingLeader = await this.registrationRepository.findByLeaderPhone(registration.leader.phone);
    if (existingLeader) {
      throw new Error('领队手机号已被注册');
    }
    
    // 持久化
    return await this.registrationRepository.save(registration);
  }
}
```

### 子领域服务实现

```javascript
// 子领域服务示例 - TeamService.js
class TeamService {
  constructor(registrationService) {
    this.registrationService = registrationService;
  }

  async createTeamLeader(leaderData) {
    // 子领域特有逻辑
    const inviteCode = this.generateInviteCode();
    
    // 构建注册数据
    const registrationData = {
      teamName: leaderData.teamName || leaderData.name,
      leader: leaderData,
      inviteCode,
      status: 'PENDING'
    };
    
    // 调用主领域服务
    return await this.registrationService.createRegistration(registrationData);
  }
  
  // 子领域特有方法
  generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
```

### 控制器实现

```javascript
// 控制器示例 - teamController.js
const teamService = require('../services/TeamService');
const logger = require('../../../infrastructure/utils/helper/Logger');

const createTeamLeader = async (req, res) => {
  try {
    const leaderData = req.body;
    
    // 调用服务
    const registration = await teamService.createTeamLeader(leaderData);
    
    // 返回结果
    res.status(201).json({
      success: true,
      message: '团队创建成功',
      data: {
        id: registration._id,
        teamName: registration.teamName,
        inviteCode: registration.inviteCode
      }
    });
  } catch (error) {
    logger.error(`创建团队领队错误: ${error.message}`);
    
    res.status(error.message.includes('已被注册') ? 400 : 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createTeamLeader
};
```

## 跨领域通信

### 事件驱动通信

```javascript
// 事件发布者 - 支付服务
class PaymentService {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;
  }
  
  async processPayment(paymentData) {
    // 处理支付...
    const payment = await this.paymentRepository.save(paymentData);
    
    // 发布事件
    this.eventEmitter.emit('payment.success', {
      registrationId: payment.registrationId,
      amount: payment.amount,
      paymentId: payment.id
    });
    
    return payment;
  }
}

// 事件订阅者 - 注册服务
class RegistrationService {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;
    
    // 订阅事件
    this.eventEmitter.on('payment.success', this.handlePaymentSuccess.bind(this));
  }
  
  async handlePaymentSuccess(paymentEvent) {
    const { registrationId, amount } = paymentEvent;
    
    // 更新注册记录支付状态
    await this.updatePaymentStatus(registrationId, amount);
  }
}
```

### 直接服务调用

在某些情况下，直接服务调用是必要的：

```javascript
// 跨领域调用示例
class PaymentController {
  constructor(paymentService, registrationService) {
    this.paymentService = paymentService;
    this.registrationService = registrationService; // 跨领域引用
  }
  
  async createPayment(req, res) {
    const { registrationId, amount } = req.body;
    
    // 跨领域检查
    const registration = await this.registrationService.getRegistrationById(registrationId);
    if (!registration) {
      return res.status(404).json({ success: false, message: '注册记录不存在' });
    }
    
    // 继续处理支付...
  }
}
```

## 测试策略

1. **单元测试**：
   - 测试实体的业务规则
   - 测试领域服务的逻辑
   - 使用模拟对象隔离依赖

2. **集成测试**：
   - 测试领域服务与仓储的集成
   - 测试跨领域通信

3. **端到端测试**：
   - 测试完整的业务流程
   - 通过API接口测试

## 附录

### DDD相关资源

- [Domain-Driven Design Distilled](https://www.amazon.com/Domain-Driven-Design-Distilled-Vaughn-Vernon/dp/0134434420)
- [Implementing Domain-Driven Design](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577)
- [DDD社区](https://dddcommunity.org/)

### 工具推荐

- 静态代码分析：ESLint、SonarQube
- 架构可视化：Draw.io、PlantUML
- 测试工具：Jest、Mocha、Chai 