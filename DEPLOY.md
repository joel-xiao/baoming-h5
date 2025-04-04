# 团队报名系统部署指南

## 系统要求

- Node.js v16.x 或更高版本
- npm v8.x 或更高版本
- MongoDB v5.x（推荐）或 MySQL v8.x
- 支持现代浏览器的Web服务器（Nginx/Apache）

## 前端部署

1. **安装依赖**

```bash
cd vue-frontend
npm install
```

2. **配置环境变量**

在`vue-frontend`目录下创建`.env.production`文件：

```
VUE_APP_TITLE=团队报名平台
VUE_APP_API_URL=http://你的服务器域名/api
VUE_APP_PAYMENT_PROVIDER=wechat
```

3. **构建生产环境代码**

```bash
npm run build
```

生成的文件将位于`../public/vue`目录下，可配合后端部署或独立部署在Web服务器上。

4. **独立部署（Nginx配置示例）**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/public/vue;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 后端部署

1. **安装依赖**

```bash
cd server
npm install
```

2. **配置环境变量**

在`server`目录下创建`.env`文件：

```
# 基础配置
NODE_ENV=production
PORT=3000
BASE_URL=http://你的服务器域名

# 数据库配置（选择一种）
DB_TYPE=mongodb
MONGODB_URI=mongodb://用户名:密码@数据库地址:端口/baoming

# JWT配置
JWT_SECRET=自定义安全密钥
JWT_EXPIRES_IN=24h

# 日志配置
LOG_LEVEL=info
LOG_DIR=logs

# 邮件配置（可选）
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASS=your-password
MAIL_FROM=报名系统 <noreply@example.com>

# 支付配置（根据需要配置）
WECHAT_PAY_APP_ID=你的微信支付AppID
WECHAT_PAY_MCH_ID=你的微信支付商户号
WECHAT_PAY_KEY=你的微信支付API密钥
```

3. **启动服务**

开发环境：
```bash
npm run dev
```

生产环境：
```bash
npm start
```

4. **使用PM2管理进程（推荐生产环境）**

安装PM2：
```bash
npm install -g pm2
```

创建配置文件`ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'baoming-server',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

启动服务：
```bash
pm2 start ecosystem.config.js
```

## 数据库配置

### MongoDB（推荐）

1. 安装MongoDB：参考[官方文档](https://docs.mongodb.com/manual/installation/)
2. 创建数据库和用户：
```
use baoming
db.createUser({
  user: "baomingUser",
  pwd: "yourPassword",
  roles: [{ role: "readWrite", db: "baoming" }]
})
```
3. 在环境变量中配置：
```
DB_TYPE=mongodb
MONGODB_URI=mongodb://baomingUser:yourPassword@localhost:27017/baoming
```

### MySQL

1. 安装MySQL：参考[官方文档](https://dev.mysql.com/doc/refman/8.0/en/installing.html)
2. 创建数据库和用户：
```sql
CREATE DATABASE baoming CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'baomingUser'@'localhost' IDENTIFIED BY 'yourPassword';
GRANT ALL PRIVILEGES ON baoming.* TO 'baomingUser'@'localhost';
FLUSH PRIVILEGES;
```
3. 在环境变量中配置：
```
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=baomingUser
MYSQL_PASSWORD=yourPassword
MYSQL_DB=baoming
```

### 文件系统存储（适用于简单部署场景）

在环境变量中配置：
```
DB_TYPE=filesystem
```

数据将存储在`server/data`目录下的JSON文件中。

## 支付配置

### 微信支付

1. 申请微信支付商户号：[微信支付商户平台](https://pay.weixin.qq.com/)
2. 配置环境变量：
```
WECHAT_PAY_APP_ID=你的微信支付AppID
WECHAT_PAY_MCH_ID=你的微信支付商户号
WECHAT_PAY_KEY=你的微信支付API密钥
WECHAT_PAY_SECRET=你的微信支付APIv3密钥
WECHAT_PAY_NOTIFY_URL=http://你的服务器域名/api/payment/notify/wechat
```

### 支付宝

1. 申请支付宝开放平台账号：[支付宝开放平台](https://open.alipay.com/)
2. 配置环境变量：
```
ALIPAY_APP_ID=你的支付宝AppID
ALIPAY_PRIVATE_KEY=你的应用私钥
ALIPAY_PUBLIC_KEY=支付宝公钥
ALIPAY_NOTIFY_URL=http://你的服务器域名/api/payment/notify/alipay
ALIPAY_RETURN_URL=http://你的服务器域名/payment/result
```

## 问题排查

### 常见问题

1. **前端API连接问题**
   - 检查API基础URL配置是否正确
   - 确认后端服务是否正常运行
   - 检查跨域配置是否正确

2. **数据库连接失败**
   - 验证数据库地址、用户名和密码
   - 确认数据库服务是否运行
   - 检查网络和防火墙设置

3. **支付回调失败**
   - 确认回调URL是否可以从外网访问
   - 检查支付配置是否正确
   - 查看支付平台回调日志

### 日志位置

- 服务端日志：`server/logs/`目录
- PM2日志：`~/.pm2/logs/`目录

## 生产环境优化建议

1. **使用Nginx反向代理**：配置Nginx处理静态资源和SSL
2. **启用数据库缓存**：配置MongoDB或MySQL的查询缓存
3. **配置CDN加速**：将前端静态资源部署到CDN
4. **开启GZIP压缩**：减少传输数据大小
5. **定期备份数据**：设置自动备份数据库的计划任务

## 系统升级

1. **备份数据**：升级前备份数据库和配置文件
2. **拉取代码**：获取最新的代码
```bash
git pull origin main
```
3. **安装依赖**：更新依赖包
```bash
cd server && npm install
cd ../vue-frontend && npm install
```
4. **构建前端**：重新构建前端代码
```bash
cd vue-frontend && npm run build
```
5. **重启服务**：使用PM2重启服务
```bash
cd ../server && pm2 restart ecosystem.config.js
``` 