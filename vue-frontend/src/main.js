import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import PixelScroll from './components/PixelScroll.vue'

const app = createApp(App)

// 全局注册PixelScroll组件
app.component('PixelScroll', PixelScroll)

app.use(store)
app.use(router)

app.mount('#app') 