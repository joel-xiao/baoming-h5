const app = require('./index');
const config = require('./config');

// 增加调试日志
console.log('==============================================');
console.log('服务器启动中...');
console.log('当前环境:', config.app.environment);
console.log('端口设置为:', config.server.port);
console.log('==============================================');

// 异步启动服务器
const startServer = async () => {
  try {
    // 启动服务器并监听所有网络接口
    const server = app.listen(config.server.port, '0.0.0.0', () => {
      console.log('==============================================');
      console.log(`服务器运行在 http://127.0.0.1:${config.server.port}`);
      console.log(`也可通过局域网IP访问: http://${config.server.host}:${config.server.port}`);
      console.log('==============================================');
    });
    
    // 处理服务器错误
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`错误: 端口 ${config.server.port} 已被占用，请尝试其他端口`);
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