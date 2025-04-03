const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 输出路径修改为public目录，与后端集成
  outputDir: '../public/vue',
  // 开发环境设置代理，处理API请求
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
}) 