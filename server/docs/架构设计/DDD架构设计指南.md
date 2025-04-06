# 领域驱动设计(DDD)架构指南与项目结构说明

## 概述

本文档旨在为团队报名系统服务端提供领域驱动设计(DDD)的实施指南和项目结构说明，帮助开发团队理解和应用DDD原则，确保代码的一致性和可维护性。

## 更新记录

**2023年4月6日更新**:
- 添加了 BaseService 设计和实现指南
- 更新了依赖注入模式相关内容
- 补充了单例模式在领域服务中的应用
- 新增了领域服务互相依赖的设计建议

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
  - **/data**: 数据访问相关
    - **/connectors**: 数据库连接器
    - **/repositories**: 仓储实现
  - **/web**: Web相关
    - **/middlewares**: 中间件
    - **/routes**: 路由相关
    - **/response**: 响应处理
  - **/external**: 外部服务
    - **/payment**: 支付相关
    - **/messaging**: 消息服务
  - **/common**: 通用组件
    - **/utils**: 工具类
    - **/logging**: 日志相关
  - **/security**: 安全相关

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

## 依赖注入模式

本项目采用依赖注入模式来管理组件间依赖关系，提高代码的可测试性和可维护性。

### 容器设计

系统使用自定义的依赖注入容器 (`Container`) 来管理组件依赖关系：

```javascript
// 基础设施层容器定义 (/infrastructure/common/di/Container.js)
class Container {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
  }

  register(name, service, options = {}) {
    this.services.set(name, {
      service,
      singleton: options.singleton || false,
      dependencies: options.dependencies || []
    });
  }

  resolve(name) {
    // 解析依赖并返回实例
  }
}
```

所有基础设施组件在 `infrastructure/index.js` 中注册到容器：

```javascript
// 通用组件
container.register('logger', LoggerService, { singleton: true });
container.register('cache', MemoryCache, { 
  singleton: true,
  dependencies: ['logger']
});

// 数据访问组件
container.register('database', DatabaseConnector, { 
  singleton: true,
  dependencies: ['logger']
});

// 外部服务组件
container.register('emailService', EmailService, {
  singleton: true,
  dependencies: ['logger']
});
```

### BaseService 基类

所有领域服务继承自 `BaseService` 基类，它提供通用功能和依赖解析：

```javascript
// domains/services/BaseService.js
class BaseService {
  constructor() {
    // 自动注入常用依赖
    this.logger = container.resolve('logger');
    this.emailService = container.resolve('emailService');
    this.idGenerator = container.resolve('idGenerator');
    
    // 初始化当前服务
    this.init();
  }
  
  init() {
    // 子类可以覆盖此方法进行特定初始化
  }
  
  // 通用方法...
}
```

`BaseService` 提供的通用功能：

- 日志记录 (`logInfo`, `logError`)
- 邮件发送 (`sendEmail`)
- ID生成 (`generateId`)
- 响应格式化 (`successResponse`, `errorResponse`)
- 参数验证 (`validateRequired`)
- 异常处理 (`wrapAsync`)

### 服务实例化策略

领域服务采用单例模式导出，确保全局状态一致性：

```javascript
// domains/registration/services/RegistrationService.js
class RegistrationService extends BaseService {
  // 服务实现...
}

// 创建并导出单例
const registrationService = new RegistrationService();
module.exports = registrationService;
```

### 跨领域引用规则

服务之间的引用应该遵循以下规则：

- **同领域引用**：同一领域内的服务可以直接相互引用
- **跨领域引用**：不同领域之间的服务引用必须通过依赖注入容器进行解析
- **应用层调用**：控制器和应用层组件可以直接引用和调用各个领域的服务

示例：跨领域服务调用：

```javascript
// TeamService.js
init() {
  // 通过依赖注入获取其他领域的服务
  this.registrationService = container.resolve('registrationService');
}

async createTeam(teamData) {
  // 调用其他领域的服务
  await this.registrationService.checkRegistrationQuota();
}
```

### 控制器使用依赖注入的最佳实践

控制器作为应用层组件，负责处理HTTP请求并将其转发给领域服务。为保持代码的简洁性和可维护性，控制器中使用依赖注入时应遵循以下最佳实践：

#### 一次性解析常用依赖

在控制器文件顶部一次性解析常用依赖，避免在每个控制器方法中重复调用`container.resolve()`。

```javascript
// 文件顶部一次性解析
const logger = container.resolve('logger');
const responseFormatter = container.resolve('responseFormatter');
const modelFactory = container.resolve('modelFactory');

// 在控制器方法中直接使用
const getUsers = async (req, res) => {
  try {
    // 直接使用已解析的依赖
    const users = await userService.findAll();
    return responseFormatter.success(res, users);
  } catch (error) {
    logger.error(`获取用户列表错误: ${error.message}`);
    return responseFormatter.error(res, '获取用户列表失败');
  }
};
```

#### 将业务逻辑委托给领域服务

控制器应该尽量精简，主要负责：
- 解析和验证HTTP请求
- 调用领域服务处理业务逻辑
- 格式化响应结果

不应在控制器中实现复杂的业务逻辑，而应将其委托给领域服务处理。

```javascript
// 推荐做法
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    // 将业务逻辑委托给服务
    const result = await userService.createUser(userData);
    return responseFormatter.success(res, result, '用户创建成功');
  } catch (error) {
    logger.error(`创建用户错误: ${error.message}`);
    return responseFormatter.error(res, '创建用户失败');
  }
};
```

#### 统一的错误处理

在控制器中应统一处理异常，并使用一致的方式返回错误响应。

```javascript
// 统一的错误处理模式
const someAction = async (req, res) => {
  try {
    // 业务逻辑处理
    return responseFormatter.success(res, result);
  } catch (error) {
    logger.error(`操作失败: ${error.message}`);
    if (error.name === 'ValidationError') {
      return responseFormatter.badRequest(res, error.message);
    } else if (error.name === 'NotFoundError') {
      return responseFormatter.notFound(res, error.message);
    }
    return responseFormatter.error(res, '操作失败');
  }
};
```

### 代码组织原则

1. **领域边界**：
   - 尽量避免跨领域直接调用
   - 领域间通信通过领域服务的公共接口或事件进行
   - 避免领域模型的泄漏

2. **依赖方向**：
   - 业务领域可以依赖基础设施层
   - 基础设施层不应依赖业务领域
   - 子领域可以依赖其所属的主领域

3. **服务职责**：
   - 服务应专注于特定业务逻辑
   - 避免创建"万能"服务
   - 使用依赖注入获取依赖，而不是直接实例化

4. **控制器简洁性**：
   - 控制器应仅处理请求/响应逻辑
   - 业务逻辑应委托给服务层处理
   - 参数验证和转换
   - 调用领域服务
   - 处理响应和错误

5. **服务实例化和引用**：
   - 服务使用单例模式导出
   - 同领域使用相对路径引用
   - 跨领域使用别名路径引用
   - 基础设施使用别名路径引用 