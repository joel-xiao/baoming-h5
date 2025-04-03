# 武道开学报名系统接口文档

## 基础信息

- 基础URL: `/api`
- 响应格式: JSON
- 认证方式: 无需认证（除了管理员接口）

## 通用响应格式

成功响应：
```json
{
  "success": true,
  "data": { ... }  // 具体数据
}
```

失败响应：
```json
{
  "success": false,
  "message": "错误信息"
}
```

## 接口列表

### 1. 报名相关接口

#### 1.1 获取报名记录

- **接口**: `GET /registration`
- **描述**: 获取最近的已支付报名记录（最多20条）
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60a1e2b3c4d5e6f7g8h9i0j1",
        "name": "张三",
        "phone": "13800138000",
        "isTeamLeader": true,
        "teamId": "abcdef1234567890",
        "paymentStatus": "success",
        "paymentAmount": 99,
        "createdAt": "2023-04-01T12:00:00Z"
      }
    ]
  }
  ```

#### 1.2 创建队长报名

- **接口**: `POST /registration/leader`
- **描述**: 创建队长预报名记录
- **请求体**:
  ```json
  {
    "name": "张三",
    "phone": "13800138000",
    "openid": "wx_openid_123456"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "message": "队长预报名成功",
    "data": {
      "registration": { ... },
      "teamId": "abcdef1234567890"
    }
  }
  ```

#### 1.3 加入团队

- **接口**: `POST /registration/join`
- **描述**: 加入已有团队
- **请求体**:
  ```json
  {
    "name": "李四",
    "phone": "13900139000",
    "openid": "wx_openid_654321",
    "teamId": "abcdef1234567890"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "message": "成功加入团队",
    "data": {
      "registration": { ... },
      "teamId": "abcdef1234567890"
    }
  }
  ```

#### 1.4 获取团队成员

- **接口**: `GET /registration/team/:teamId`
- **描述**: 获取指定团队的已支付成员列表
- **参数**: 
  - `teamId`: 团队ID
- **响应示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60a1e2b3c4d5e6f7g8h9i0j1",
        "name": "张三",
        "phone": "13800138000",
        "isTeamLeader": true,
        "teamId": "abcdef1234567890",
        "paymentStatus": "success",
        "createdAt": "2023-04-01T12:00:00Z"
      },
      {
        "_id": "60a1e2b3c4d5e6f7g8h9i0j2",
        "name": "李四",
        "phone": "13900139000",
        "isTeamLeader": false,
        "teamId": "abcdef1234567890",
        "paymentStatus": "success",
        "createdAt": "2023-04-01T13:00:00Z"
      }
    ]
  }
  ```

### 2. 支付相关接口

#### 2.1 创建支付订单

- **接口**: `POST /payment/create`
- **描述**: 创建微信支付订单
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
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "paymentParams": {
        "appId": "wx123456789",
        "timeStamp": "1680339600",
        "nonceStr": "abcdef123456",
        "package": "prepay_id=wx123456789",
        "signType": "RSA",
        "paySign": "signature123456"
      },
      "orderId": "60a1e2b3c4d5e6f7g8h9i0j1",
      "orderNo": "ORDER20230401123456"
    }
  }
  ```

#### 2.2 支付回调接口

- **接口**: `POST /payment/notify`
- **描述**: 微信支付回调接口，由微信服务器调用
- **请求体**: 微信支付回调数据
- **响应示例**:
  ```json
  {
    "code": "SUCCESS",
    "message": "成功"
  }
  ```

#### 2.3 查询支付状态

- **接口**: `GET /payment/status/:orderNo`
- **描述**: 查询订单支付状态
- **参数**: 
  - `orderNo`: 订单号
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "paymentStatus": "success",
      "orderNo": "ORDER20230401123456"
    }
  }
  ```

### 3. 管理员接口

#### 3.1 获取所有支付订单

- **接口**: `GET /payment/admin/orders`
- **描述**: 获取所有支付订单记录（支持分页和筛选）
- **参数**: 
  - `page`: 页码，默认1
  - `limit`: 每页记录数，默认10
  - `status`: 支付状态筛选（可选）
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "orders": [
        {
          "_id": "60a1e2b3c4d5e6f7g8h9i0j1",
          "name": "张三",
          "phone": "13800138000",
          "orderNo": "ORDER20230401123456",
          "paymentAmount": 99,
          "paymentStatus": "success",
          "isTeamLeader": true,
          "paymentTime": "2023-04-01T12:05:00Z",
          "createdAt": "2023-04-01T12:00:00Z"
        }
      ],
      "pagination": {
        "total": 100,
        "page": 1,
        "limit": 10,
        "pages": 10
      }
    }
  }
  ```

#### 3.2 获取所有报名记录

- **接口**: `GET /admin/registrations`
- **描述**: 获取所有报名记录（支持分页和筛选）
- **参数**: 
  - `page`: 页码，默认1
  - `limit`: 每页记录数，默认20
  - `status`: 支付状态筛选（可选）
  - `isTeamLeader`: 是否队长（可选）
  - `search`: 搜索关键词（可选）
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "registrations": [
        {
          "_id": "60a1e2b3c4d5e6f7g8h9i0j1",
          "name": "张三",
          "phone": "13800138000",
          "orderNo": "ORDER20230401123456",
          "paymentAmount": 99,
          "paymentStatus": "success",
          "isTeamLeader": true,
          "teamId": "abcdef1234567890",
          "createdAt": "2023-04-01T12:00:00Z"
        }
      ],
      "pagination": {
        "total": 100,
        "page": 1,
        "limit": 20,
        "pages": 5
      }
    }
  }
  ```

#### 3.3 获取报名统计数据

- **接口**: `GET /admin/stats`
- **描述**: 获取报名统计信息
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "totalCount": 150,
      "teamLeaderCount": 30,
      "teamMemberCount": 120,
      "totalAmount": 14850,
      "todayCount": 25
    }
  }
  ```

#### 3.4 导出报名数据

- **接口**: `GET /admin/export`
- **描述**: 导出报名数据为CSV文件
- **参数**: 
  - `status`: 支付状态筛选（可选）
  - `isTeamLeader`: 是否队长（可选）
- **响应**: CSV文件下载

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
  paymentStatus: String,     // 支付状态：pending/success/failed
  paymentTime: Date,         // 支付时间
  transactionId: String,     // 微信支付交易ID
  prepayId: String,          // 微信支付预支付ID
  createdAt: Date,           // 创建时间
  updatedAt: Date            // 更新时间
}
```

## 错误码说明

- 200: 请求成功
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器内部错误 