# 团队报名系统API文档

## 基础信息

- **基础URL**: `/api`
- **响应格式**: JSON
- **认证方式**: 普通接口无需认证，管理员接口需认证

## 通用响应格式

**成功响应**:
```json
{
  "success": true,
  "data": { ... }
}
```

**失败响应**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

## API接口列表

### 1. 报名相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/registration` | GET | 获取最近报名记录 |
| `/registration/leader` | POST | 创建队长预报名 |
| `/registration/join` | POST | 加入已有团队 |
| `/registration/team/:teamId` | GET | 获取团队成员列表 |

### 2. 支付相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/payment/create` | POST | 创建支付订单 |
| `/payment/notify` | POST | 支付回调接口 |
| `/payment/status/:orderNo` | GET | 查询支付状态 |

### 3. 管理员接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/payment/admin/orders` | GET | 获取支付订单列表 |
| `/admin/registrations` | GET | 获取报名记录列表 |
| `/admin/stats` | GET | 获取统计数据 |
| `/admin/export` | GET | 导出报名数据 |

### 4. 时间相关接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/time/server-time` | GET | 获取服务器时间 |

## 接口详细说明

### 报名接口

#### 获取报名记录
- **接口**: `GET /registration`
- **响应**: 最近20条已支付报名记录

#### 创建队长报名
- **接口**: `POST /registration/leader`
- **请求体**:
  ```json
  {
    "name": "张三",
    "phone": "13800138000",
    "openid": "wx_openid_123456"
  }
  ```

#### 加入团队
- **接口**: `POST /registration/join`
- **请求体**:
  ```json
  {
    "name": "李四",
    "phone": "13900139000",
    "openid": "wx_openid_654321",
    "teamId": "abcdef1234567890"
  }
  ```

#### 获取团队成员
- **接口**: `GET /registration/team/:teamId`
- **参数**: `teamId` - 团队ID

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