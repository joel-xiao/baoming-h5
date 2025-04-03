const app = require('./index');
require('dotenv').config();

// 设置端口
const PORT = process.env.PORT || 3001;

// 增加调试日志
console.log('==============================================');
console.log('服务器启动中...');
console.log('当前环境:', process.env.NODE_ENV || 'development');
console.log('配置文件已加载');
console.log('端口设置为:', PORT);
console.log('==============================================');

// 异步启动服务器
const startServer = async () => {
  try {
    // 启动服务器并监听所有网络接口
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('==============================================');
      console.log(`服务器运行在 http://127.0.0.1:${PORT}`);
      console.log(`也可通过局域网IP访问: http://192.168.31.243:${PORT}`);
      console.log('API路由已注册:');
      console.log(' - /api/registration');
      console.log(' - /api/payment');
      console.log(' - /api/admin');
      console.log('==============================================');
    });
    
    // 处理服务器错误
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`错误: 端口 ${PORT} 已被占用，请尝试其他端口`);
        process.exit(1);
      } else {
        console.error('服务器启动错误:', error);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('启动服务器失败:', err);
    process.exit(1);
  }
};

// 启动服务器
startServer(); 