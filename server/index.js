const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

// 初始化Express应用
const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件目录
// 注意：在实际部署时可能需要将vue-frontend/dist作为静态目录
app.use(express.static(path.join(__dirname, './public')));

// 连接数据库
connectDB();

// 路由导入
const registrationRoutes = require('./routes/registration');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');

// 注册路由
app.use('/api/registration', registrationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 前端路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, './public', 'success.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, './admin', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 处理404请求
app.use((req, res) => {
  res.status(404).json({ success: false, message: '请求的资源不存在' });
});

// 导出app供主程序使用
module.exports = app; 