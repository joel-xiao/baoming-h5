const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  // 输出路径修改为public目录，与后端集成
  outputDir: '../public/vue',
  // 配置路径别名
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@mobile': path.resolve(__dirname, 'src/components/mobile'),
        '@admin': path.resolve(__dirname, 'src/components/admin')
      }
    }
  },
  // 开发环境设置代理，处理API请求
  devServer: {
    host: '0.0.0.0', // 允许外部IP访问
    port: 8080, // 指定端口
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // 确保指向后端服务的正确端口
        changeOrigin: true,
        logLevel: 'debug', // 添加调试日志
        onProxyReq(proxyReq, req, res) {
          console.log('代理请求:', req.method, req.url);
        },
        onProxyRes(proxyRes, req, res) {
          console.log('代理响应:', proxyRes.statusCode, req.url);
        }
      }
    }
  }
}) 