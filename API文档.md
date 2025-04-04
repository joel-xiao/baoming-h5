# 团队报名系统 API 文档

## 概述

本文档描述了团队报名系统的API接口，所有接口均以 `/api` 作为前缀。

API采用RESTful设计风格，使用JSON格式进行数据交换，状态码遵循HTTP标准。

### 基础URL

```
http://localhost:3000/api
```

### 状态码说明

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 认证失败
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

### 通用返回格式

```json
{
  "success": true|false,
  "message": "操作结果描述",
  "data": {
    // 返回的数据
  }
}
```

### 认证方式

系统使用JWT (JSON Web Token) 进行认证，需要认证的API需要在请求头中添加：

```
Authorization: Bearer {token}
```

## 公共API

### 健康检查

```
GET /api/health
```

返回示例：

```json
{
  "status": "ok",
  "timestamp": "2023-04-04T12:34:56.789Z"
}
```

### 获取服务器时间

```
GET /api/time
```

返回示例：

```json
{
  "serverTime": "2023-04-04T12:34:56.789Z"
}
```

## 身份认证 API

### 管理员登录

```
POST /api/auth/login
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

返回示例：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1234567890",
      "username": "admin",
      "name": "管理员",
      "role": "admin"
    }
  }
}
```

### 刷新令牌

```
POST /api/auth/refresh
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| refreshToken | string | 是 | 刷新令牌 |

返回示例：

```json
{
  "success": true,
  "message": "令牌刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 退出登录

```
POST /api/auth/logout
```

需要认证：是

返回示例：

```json
{
  "success": true,
  "message": "退出登录成功"
}
```

### 获取当前用户信息

```
GET /api/auth/me
```

需要认证：是

返回示例：

```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "1234567890",
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "role": "admin",
    "status": "active",
    "lastLoginAt": "2023-04-04T12:34:56.789Z"
  }
}
```

### 修改密码

```
PUT /api/auth/password
```

需要认证：是

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| currentPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码 |

返回示例：

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 发送密码重置邮件

```
POST /api/auth/password/reset
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| email | string | 是 | 邮箱地址 |

返回示例：

```json
{
  "success": true,
  "message": "密码重置邮件已发送"
}
```

### 使用令牌重置密码

```
PUT /api/auth/password/reset/:token
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| token | string | 是 | 重置令牌（URL参数） |
| newPassword | string | 是 | 新密码 |

返回示例：

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

## 报名 API

### 获取最近的报名记录

```
GET /api/registration
```

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| limit | number | 否 | 返回记录数量，默认10 |

返回示例：

```json
{
  "success": true,
  "message": "获取近期注册记录成功",
  "data": [
    {
      "id": "1234567890",
      "teamName": "冠军队",
      "leader": {
        "name": "张三",
        "organization": "ABC公司"
      },
      "createdAt": "2023-04-04T12:34:56.789Z"
    }
  ]
}
```

### 创建新报名

```
POST /api/registration
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| teamName | string | 是 | 团队名称 |
| leader | object | 是 | 队长信息 |
| leader.name | string | 是 | 队长姓名 |
| leader.gender | string | 是 | 队长性别 (male/female) |
| leader.phone | string | 是 | 队长电话 |
| leader.email | string | 否 | 队长邮箱 |
| leader.idCard | string | 否 | 队长身份证号 |
| leader.organization | string | 否 | 队长所属组织 |
| members | array | 否 | 团队成员信息 |
| additionalInfo | object | 否 | 附加信息 |

返回示例：

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": "1234567890",
    "teamName": "冠军队",
    "status": "pending"
  }
}
```

### 获取单个报名详情

```
GET /api/registration/:id
```

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 报名记录ID |

返回示例：

```json
{
  "success": true,
  "message": "获取注册记录成功",
  "data": {
    "id": "1234567890",
    "teamName": "冠军队",
    "leader": {
      "name": "张三",
      "gender": "male",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "idCard": "110101199001011234",
      "organization": "ABC公司"
    },
    "members": [
      {
        "name": "李四",
        "gender": "male",
        "phone": "13900139000"
      }
    ],
    "status": "pending",
    "paymentStatus": "unpaid",
    "createdAt": "2023-04-04T12:34:56.789Z"
  }
}
```

### 更新报名信息

```
PUT /api/registration/:id
```

需要认证：是

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 报名记录ID |

请求参数：
可更新的字段包括：teamName, leader信息, members, additionalInfo等，但不包括status, reviewedAt等敏感字段。

返回示例：

```json
{
  "success": true,
  "message": "更新注册记录成功",
  "data": {
    "id": "1234567890",
    "teamName": "冠军队-更新",
    "status": "pending"
  }
}
```

### 删除报名

```
DELETE /api/registration/:id
```

需要认证：是

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 报名记录ID |

返回示例：

```json
{
  "success": true,
  "message": "删除报名记录成功"
}
```

### 获取团队成员列表

```
GET /api/registration/team/:teamId
```

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| teamId | string | 是 | 团队ID |

返回示例：

```json
{
  "success": true,
  "message": "获取团队成员成功",
  "data": {
    "teamName": "冠军队",
    "leader": {
      "id": "1234567890",
      "name": "张三",
      "phone": "13800138000"
    },
    "members": [
      {
        "id": "0987654321",
        "name": "李四",
        "phone": "13900139000",
        "joinedAt": "2023-04-04T12:34:56.789Z"
      }
    ]
  }
}
```

### 创建队长预报名

```
POST /api/registration/leader
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| teamName | string | 是 | 团队名称 |
| name | string | 是 | 队长姓名 |
| gender | string | 是 | 队长性别 (male/female) |
| phone | string | 是 | 队长电话 |
| email | string | 否 | 队长邮箱 |
| eventId | string | 是 | 赛事ID |
| categoryId | string | 是 | 赛事类别ID |

返回示例：

```json
{
  "success": true,
  "message": "队长预报名成功",
  "data": {
    "id": "1234567890",
    "teamName": "冠军队",
    "teamId": "5678901234",
    "status": "pre_register",
    "inviteCode": "ABCDEF"
  }
}
```

### 加入已有团队

```
POST /api/registration/join
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| inviteCode | string | 是 | 邀请码 |
| name | string | 是 | 成员姓名 |
| gender | string | 是 | 成员性别 (male/female) |
| phone | string | 是 | 成员电话 |
| email | string | 否 | 成员邮箱 |
| idCard | string | 否 | 成员身份证号 |

返回示例：

```json
{
  "success": true,
  "message": "成功加入团队",
  "data": {
    "memberId": "0987654321",
    "teamId": "5678901234",
    "teamName": "冠军队"
  }
}
```

### 审核报名

```
PUT /api/registration/:id/review
```

需要认证：是

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 报名记录ID |

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| status | string | 是 | 审核状态 (approved/rejected) |
| remarks | string | 否 | 审核备注，拒绝时必填 |

返回示例：

```json
{
  "success": true,
  "message": "审核通过成功",
  "data": {
    "id": "1234567890",
    "teamName": "冠军队",
    "status": "approved",
    "reviewedAt": "2023-04-04T12:34:56.789Z",
    "reviewer": "管理员"
  }
}
```

### 更新支付状态

```
PUT /api/registration/:id/payment-status
```

需要认证：是

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 报名记录ID |

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| paymentStatus | string | 是 | 支付状态 (unpaid/paid/refunded) |
| paidAmount | number | 否 | 支付金额 |

返回示例：

```json
{
  "success": true,
  "message": "支付状态更新成功",
  "data": {
    "id": "1234567890",
    "paymentStatus": "paid",
    "paidAmount": 100,
    "paidAt": "2023-04-04T12:34:56.789Z"
  }
}
```

## 支付 API

### 创建支付订单

```
POST /api/payment/create
```

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| registrationId | string | 是 | 报名记录ID |
| amount | number | 是 | 支付金额 |
| paymentMethod | string | 是 | 支付方式 (wechat/alipay/bank/onsite) |
| returnUrl | string | 否 | 支付完成后的前端跳转URL |

返回示例：

```json
{
  "success": true,
  "message": "支付订单创建成功",
  "data": {
    "id": "9876543210",
    "amount": 100,
    "paymentMethod": "wechat",
    "payUrl": "weixin://wxpay/bizpayurl?pr=xxxxxxxxxxx",
    "qrCode": "base64编码的二维码图片",
    "status": "pending",
    "expiredAt": "2023-04-04T13:34:56.789Z"
  }
}
```

### 查询支付状态

```
GET /api/payment/status/:id
```

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 支付订单ID |

返回示例：

```json
{
  "success": true,
  "message": "获取支付状态成功",
  "data": {
    "id": "9876543210",
    "status": "completed",
    "paymentMethod": "wechat",
    "transactionId": "4567890123",
    "paidAt": "2023-04-04T12:40:56.789Z"
  }
}
```

### 微信支付回调接口

```
POST /api/payment/notify/wechat
```

该接口由微信支付服务器调用，接收支付结果通知。

### 支付宝支付回调接口

```
POST /api/payment/notify/alipay
```

该接口由支付宝服务器调用，接收支付结果通知。

### 手动更新支付状态

```
PUT /api/payment/:id/status
```

需要认证：是

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 支付订单ID |

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| status | string | 是 | 支付状态 (pending/processing/completed/refunded/canceled) |
| transactionId | string | 否 | 交易流水号 |
| remarks | string | 否 | 备注 |

返回示例：

```json
{
  "success": true,
  "message": "支付状态更新成功",
  "data": {
    "id": "9876543210",
    "status": "completed",
    "transactionId": "4567890123",
    "paidAt": "2023-04-04T12:40:56.789Z"
  }
}
```

### 获取报名记录的所有支付记录

```
GET /api/payment/registration/:registrationId
```

需要认证：是

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| registrationId | string | 是 | 报名记录ID |

返回示例：

```json
{
  "success": true,
  "message": "获取支付记录成功",
  "data": [
    {
      "id": "9876543210",
      "registrationId": "1234567890",
      "amount": 100,
      "paymentMethod": "wechat",
      "status": "completed",
      "transactionId": "4567890123",
      "paidAt": "2023-04-04T12:40:56.789Z",
      "createdAt": "2023-04-04T12:34:56.789Z"
    }
  ]
}
```

### 管理员获取所有支付订单

```
GET /api/payment/admin/orders
```

需要认证：是

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |
| status | string | 否 | 支付状态 |
| paymentMethod | string | 否 | 支付方式 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

返回示例：

```json
{
  "success": true,
  "message": "获取支付订单成功",
  "data": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "orders": [
      {
        "id": "9876543210",
        "registrationId": "1234567890",
        "teamName": "冠军队",
        "amount": 100,
        "paymentMethod": "wechat",
        "status": "completed",
        "paidAt": "2023-04-04T12:40:56.789Z"
      }
    ]
  }
}
```

### 退款

```
POST /api/payment/refund/:id
```

需要认证：是

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 支付订单ID |

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| amount | number | 否 | 退款金额，默认全额退款 |
| reason | string | 否 | 退款原因 |

返回示例：

```json
{
  "success": true,
  "message": "退款申请提交成功",
  "data": {
    "id": "9876543210",
    "refundId": "5432109876",
    "amount": 100,
    "status": "refunded",
    "refundedAt": "2023-04-04T14:34:56.789Z"
  }
}
```

### 获取支付统计数据

```
GET /api/payment/statistics
```

需要认证：是

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| groupBy | string | 否 | 分组方式 (day/week/month) |

返回示例：

```json
{
  "success": true,
  "message": "获取支付统计数据成功",
  "data": {
    "totalAmount": 10000,
    "totalCount": 100,
    "paymentMethodStats": [
      {
        "method": "wechat",
        "count": 60,
        "amount": 6000
      },
      {
        "method": "alipay",
        "count": 40,
        "amount": 4000
      }
    ],
    "dailyStats": [
      {
        "date": "2023-04-01",
        "count": 20,
        "amount": 2000
      },
      {
        "date": "2023-04-02",
        "count": 30,
        "amount": 3000
      }
    ]
  }
}
```

## API接口列表

### 1. 支付相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/payment/create` | POST | 创建支付订单 |
| `/payment/notify` | POST | 支付回调接口 |
| `/payment/status/:orderNo` | GET | 查询支付状态 |

### 2. 管理员接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/payment/admin/orders` | GET | 获取支付订单列表 |
| `/admin/registrations` | GET | 获取报名记录列表 |
| `/admin/stats` | GET | 获取统计数据(需要鉴权) |
| `/admin/export` | GET | 导出报名数据 |

### 3. 时间相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/time/server-time` | GET | 获取服务器时间 |

### 4. 统计相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/stats/record-view` | POST | 记录页面浏览量 |
| `/stats/public` | GET | 获取公开统计数据 |

## 接口详细说明

### 支付接口

#### 创建支付订单
- **接口**: `POST /payment/create`
- **请求体**:
  ```json
  {
    "openid": "wx_openid_123456",
    "name": "张三",
    "phone": "13800138000",
    "isTeamLeader": true,
    "amount": 99
  }
  ```

#### 查询支付状态
- **接口**: `GET /payment/status/:orderNo`
- **参数**: `orderNo` - 订单号

### 管理员接口

#### 获取所有支付订单
- **接口**: `GET /payment/admin/orders`
- **参数**: 
  - `page`: 页码(默认1)
  - `limit`: 每页记录数(默认10)
  - `status`: 支付状态

#### 获取报名统计数据
- **接口**: `GET /admin/stats`
- **响应**: 包含报名总数、队长数、成员数等统计信息

### 时间接口

#### 获取服务器时间
- **接口**: `GET /time/server-time`
- **响应**: 服务器当前时间信息
  ```json
  {
    "success": true,
    "data": {
      "timestamp": 1619712045123,
      "iso": "2021-04-29T15:34:05.123Z",
      "timezone": "Asia/Shanghai"
    }
  }
  ```
- **说明**: 
  用于前端同步服务器时间，解决用户本地时间不准确问题，
  特别用于倒计时等对时间准确性要求较高的功能。
  前端获取到服务器时间后，可以将其与本地时间做对比，计算时间偏移量，
  以便在后续的计时中能够基于服务器时间来实现准确的倒计时。

### 统计接口

#### 记录页面浏览量
- **接口**: `POST /stats/record-view`
- **请求体**: 无需参数
- **响应**: 
  ```json
  {
    "success": true,
    "message": "浏览量记录成功"
  }
  ```
- **说明**:
  该接口用于记录页面访问量，不需要鉴权，
  前端可以在页面加载时调用该接口自动记录浏览次数。

#### 获取公开统计数据
- **接口**: `GET /stats/public`
- **请求参数**: 无需参数
- **响应**:
  ```json
  {
    "success": true,
    "message": "获取统计数据成功",
    "data": {
      "viewsCount": 2893
    }
  }
  ```
- **说明**:
  该接口用于获取公开可访问的统计数据，不需要鉴权，
  返回的数据包括总参与人数、队长数量、队员数量、总金额等信息，
  前端可以在首页或活动页面展示这些统计数据。

## 数据模型

### Registration 模型
```javascript
{
  name: String,              // 姓名
  phone: String,             // 手机号
  openid: String,            // 微信openid
  orderNo: String,           // 订单号
  isTeamLeader: Boolean,     // 是否队长
  teamId: String,            // 团队ID
  paymentAmount: Number,     // 支付金额
  paymentStatus: String,     // 支付状态
  paymentTime: Date,         // 支付时间
  createdAt: Date            // 创建时间
}
```

## 调用示例

```javascript
// 引入Axios
import axios from 'axios';

// 配置API
const api = axios.create({
  baseURL: '/api'
});

// 创建队长报名
async function createLeader(data) {
  try {
    const response = await api.post('/registration/leader', data);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('API调用错误:', error);
    return null;
  }
}
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器错误 | 

## 管理员 API

### 获取所有报名列表

```
GET /api/admin/registrations
```

需要认证：是（仅管理员）

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |
| status | string | 否 | 筛选状态 |
| search | string | 否 | 搜索关键词 |
| category | string | 否 | 赛事类别 |
| sort | string | 否 | 排序字段 |
| order | string | 否 | 排序方向 (asc/desc) |

返回示例：

```json
{
  "success": true,
  "message": "获取报名列表成功",
  "data": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "registrations": [
      {
        "id": "1234567890",
        "teamName": "冠军队",
        "leaderName": "张三",
        "status": "approved",
        "paymentStatus": "paid",
        "createdAt": "2023-04-04T12:34:56.789Z"
      }
    ]
  }
}
```

### 批量导出报名数据

```
GET /api/admin/export/registrations
```

需要认证：是（仅管理员）

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| format | string | 否 | 导出格式 (csv/excel)，默认excel |
| status | string | 否 | 筛选状态 |
| category | string | 否 | 赛事类别 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

返回内容：
文件下载流，Content-Type 为 application/vnd.ms-excel 或 text/csv。

### 系统配置管理

```
GET /api/admin/config
```

需要认证：是（仅管理员）

返回示例：

```json
{
  "success": true,
  "message": "获取系统配置成功",
  "data": {
    "registrationOpen": true,
    "registrationDeadline": "2023-05-01T23:59:59.999Z",
    "maxTeamSize": 5,
    "requiredFields": ["name", "phone", "idCard"],
    "paymentSettings": {
      "amount": 100,
      "description": "报名费",
      "methods": ["wechat", "alipay"]
    }
  }
}
```

### 更新系统配置

```
PUT /api/admin/config
```

需要认证：是（仅管理员）

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| registrationOpen | boolean | 否 | 是否开放报名 |
| registrationDeadline | string | 否 | 报名截止日期 |
| maxTeamSize | number | 否 | 最大团队人数 |
| requiredFields | array | 否 | 必填字段列表 |
| paymentSettings | object | 否 | 支付设置 |

返回示例：

```json
{
  "success": true,
  "message": "系统配置更新成功",
  "data": {
    "registrationOpen": true,
    "registrationDeadline": "2023-05-01T23:59:59.999Z"
  }
}
```

### 管理员用户管理

```
GET /api/admin/users
```

需要认证：是（仅超级管理员）

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |
| role | string | 否 | 筛选角色 |
| status | string | 否 | 筛选状态 |
| search | string | 否 | 搜索关键词 |

返回示例：

```json
{
  "success": true,
  "message": "获取管理员用户列表成功",
  "data": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "users": [
      {
        "id": "1234567890",
        "username": "admin",
        "name": "管理员",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "lastLoginAt": "2023-04-04T12:34:56.789Z",
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 创建管理员账号

```
POST /api/admin/users
```

需要认证：是（仅超级管理员）

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| name | string | 是 | 姓名 |
| email | string | 是 | 邮箱 |
| role | string | 是 | 角色 (admin/operator) |
| permissions | array | 否 | 权限列表 |

返回示例：

```json
{
  "success": true,
  "message": "管理员账号创建成功",
  "data": {
    "id": "1234567890",
    "username": "newadmin",
    "name": "新管理员",
    "role": "operator"
  }
}
```

### 更新管理员账号

```
PUT /api/admin/users/:id
```

需要认证：是（仅超级管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 用户ID |

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| name | string | 否 | 姓名 |
| email | string | 否 | 邮箱 |
| role | string | 否 | 角色 |
| status | string | 否 | 状态 (active/inactive) |
| permissions | array | 否 | 权限列表 |

返回示例：

```json
{
  "success": true,
  "message": "管理员账号更新成功",
  "data": {
    "id": "1234567890",
    "name": "新管理员-更新",
    "role": "admin",
    "status": "active"
  }
}
```

### 删除管理员账号

```
DELETE /api/admin/users/:id
```

需要认证：是（仅超级管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 用户ID |

返回示例：

```json
{
  "success": true,
  "message": "管理员账号删除成功"
}
```

### 重置管理员密码

```
POST /api/admin/users/:id/reset-password
```

需要认证：是（仅超级管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 用户ID |

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| newPassword | string | 是 | 新密码 |

返回示例：

```json
{
  "success": true,
  "message": "管理员密码重置成功"
}
```

### 获取系统日志

```
GET /api/admin/logs
```

需要认证：是（仅管理员）

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |
| level | string | 否 | 日志级别 (info/warn/error) |
| type | string | 否 | 操作类型 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| user | string | 否 | 操作人ID |

返回示例：

```json
{
  "success": true,
  "message": "获取系统日志成功",
  "data": {
    "total": 1000,
    "page": 1,
    "limit": 20,
    "logs": [
      {
        "id": "1234567890",
        "level": "info",
        "type": "login",
        "message": "管理员登录",
        "userId": "0987654321",
        "username": "admin",
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2023-04-04T12:34:56.789Z"
      }
    ]
  }
}
```

### 统计面板数据

```
GET /api/admin/dashboard
```

需要认证：是（仅管理员）

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| period | string | 否 | 统计周期 (today/week/month/year)，默认today |

返回示例：

```json
{
  "success": true,
  "message": "获取统计数据成功",
  "data": {
    "registrations": {
      "total": 100,
      "pending": 20,
      "approved": 70,
      "rejected": 10
    },
    "payments": {
      "total": 70,
      "amount": 7000,
      "pending": 5,
      "paid": 65
    },
    "recentRegistrations": [
      {
        "id": "1234567890",
        "teamName": "冠军队",
        "leaderName": "张三",
        "createdAt": "2023-04-04T12:34:56.789Z"
      }
    ],
    "registrationTrend": [
      {
        "date": "2023-04-01",
        "count": 10
      },
      {
        "date": "2023-04-02",
        "count": 15
      }
    ]
  }
}
```

### 创建赛事类别

```
POST /api/admin/categories
```

需要认证：是（仅管理员）

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| name | string | 是 | 类别名称 |
| code | string | 是 | 类别代码 |
| description | string | 否 | 类别描述 |
| fee | number | 是 | 报名费 |
| maxTeamSize | number | 是 | 最大团队人数 |
| minTeamSize | number | 是 | 最小团队人数 |
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |
| status | string | 是 | 状态 (active/inactive) |

返回示例：

```json
{
  "success": true,
  "message": "赛事类别创建成功",
  "data": {
    "id": "1234567890",
    "name": "成人组",
    "code": "adult",
    "fee": 100,
    "status": "active"
  }
}
```

### 获取所有赛事类别

```
GET /api/admin/categories
```

需要认证：是（仅管理员）

返回示例：

```json
{
  "success": true,
  "message": "获取赛事类别成功",
  "data": [
    {
      "id": "1234567890",
      "name": "成人组",
      "code": "adult",
      "description": "18岁以上成人组",
      "fee": 100,
      "maxTeamSize": 5,
      "minTeamSize": 3,
      "startDate": "2023-05-01T00:00:00.000Z",
      "endDate": "2023-05-10T23:59:59.999Z",
      "status": "active"
    }
  ]
}
```

### 更新赛事类别

```
PUT /api/admin/categories/:id
```

需要认证：是（仅管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 类别ID |

请求参数：类似于创建赛事类别的参数。

返回示例：

```json
{
  "success": true,
  "message": "赛事类别更新成功",
  "data": {
    "id": "1234567890",
    "name": "成人组-更新",
    "fee": 120,
    "status": "active"
  }
}
```

### 删除赛事类别

```
DELETE /api/admin/categories/:id
```

需要认证：是（仅管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 类别ID |

返回示例：

```json
{
  "success": true,
  "message": "赛事类别删除成功"
}
```

### 创建系统公告

```
POST /api/admin/announcements
```

需要认证：是（仅管理员）

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| title | string | 是 | 公告标题 |
| content | string | 是 | 公告内容 |
| type | string | 是 | 公告类型 (notice/alert) |
| startAt | string | 是 | 开始显示时间 |
| endAt | string | 是 | 结束显示时间 |
| priority | number | 否 | 优先级，默认0 |
| status | string | 是 | 状态 (active/inactive) |

返回示例：

```json
{
  "success": true,
  "message": "系统公告创建成功",
  "data": {
    "id": "1234567890",
    "title": "报名开始公告",
    "type": "notice",
    "status": "active"
  }
}
```

### 获取系统公告列表

```
GET /api/admin/announcements
```

需要认证：是（仅管理员）

查询参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |
| status | string | 否 | 状态筛选 |
| type | string | 否 | 类型筛选 |

返回示例：

```json
{
  "success": true,
  "message": "获取系统公告成功",
  "data": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "announcements": [
      {
        "id": "1234567890",
        "title": "报名开始公告",
        "type": "notice",
        "startAt": "2023-04-01T00:00:00.000Z",
        "endAt": "2023-04-30T23:59:59.999Z",
        "status": "active",
        "createdBy": "admin",
        "createdAt": "2023-03-28T12:34:56.789Z"
      }
    ]
  }
}
```

### 更新系统公告

```
PUT /api/admin/announcements/:id
```

需要认证：是（仅管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 公告ID |

请求参数：类似于创建系统公告的参数。

返回示例：

```json
{
  "success": true,
  "message": "系统公告更新成功",
  "data": {
    "id": "1234567890",
    "title": "报名开始公告-更新",
    "status": "active"
  }
}
```

### 删除系统公告

```
DELETE /api/admin/announcements/:id
```

需要认证：是（仅管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 公告ID |

返回示例：

```json
{
  "success": true,
  "message": "系统公告删除成功"
}
```

### 生成数据备份

```
POST /api/admin/backup
```

需要认证：是（仅超级管理员）

请求参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| type | string | 否 | 备份类型 (full/data)，默认full |

返回示例：

```json
{
  "success": true,
  "message": "数据备份生成成功",
  "data": {
    "id": "1234567890",
    "filename": "backup-20230404123456.zip",
    "size": 1024,
    "downloadUrl": "/api/admin/backup/download/1234567890",
    "createdAt": "2023-04-04T12:34:56.789Z"
  }
}
```

### 下载数据备份

```
GET /api/admin/backup/download/:id
```

需要认证：是（仅超级管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 备份ID |

返回内容：
文件下载流，Content-Type 为 application/zip。

### 获取备份列表

```
GET /api/admin/backup/list
```

需要认证：是（仅超级管理员）

返回示例：

```json
{
  "success": true,
  "message": "获取备份列表成功",
  "data": [
    {
      "id": "1234567890",
      "filename": "backup-20230404123456.zip",
      "type": "full",
      "size": 1024,
      "createdAt": "2023-04-04T12:34:56.789Z"
    }
  ]
}
```

### 删除数据备份

```
DELETE /api/admin/backup/:id
```

需要认证：是（仅超级管理员）

路径参数：

| 参数名 | 类型 | 必须 | 描述 |
|-------|------|------|------|
| id | string | 是 | 备份ID |

返回示例：

```json
{
  "success": true,
  "message": "数据备份删除成功"
}
```

## 常量定义

系统中使用了一系列常量来表示状态、角色等信息，以下是主要常量的定义：

### 角色定义

- `SUPER_ADMIN`: 超级管理员
- `ADMIN`: 管理员
- `OPERATOR`: 操作员
- `USER`: 普通用户

### 报名状态

- `DRAFT`: 草稿
- `PENDING`: 待审核
- `APPROVED`: 审核通过
- `REJECTED`: 审核拒绝
- `CANCELED`: 已取消
- `COMPLETED`: 已完成
- `PRE_REGISTER`: 预报名

### 支付状态

- `UNPAID`: 未支付
- `PENDING`: 支付中
- `PAID`: 已支付
- `REFUNDED`: 已退款
- `CANCELED`: 已取消

### 支付方式

- `WECHAT`: 微信支付
- `ALIPAY`: 支付宝
- `BANK_TRANSFER`: 银行转账
- `CASH`: 现金支付
- `ONSITE`: 现场支付 