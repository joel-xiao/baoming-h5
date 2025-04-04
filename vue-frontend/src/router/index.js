import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@views/mobile/HomeView.vue'

const routes = [
  // 普通用户路由
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/success',
    name: 'success',
    component: () => import(/* webpackChunkName: "success" */ '@views/mobile/SuccessView.vue')
  },
  
  // 管理员路由 - 以/admin开头的路径
  {
    path: '/admin',
    name: 'admin',
    redirect: '/admin/login'
  },
  {
    path: '/admin/login',
    name: 'adminLogin',
    component: () => import(/* webpackChunkName: "admin" */ '@views/admin/AdminLoginView.vue')
  },
  {
    path: '/admin/orders',
    name: 'adminOrders',
    component: () => import(/* webpackChunkName: "admin" */ '@views/admin/AdminOrdersView.vue'),
    meta: { requiresAdmin: true }
  },
  
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 全局路由守卫检查管理员权限
router.beforeEach((to, from, next) => {
  // 检查是否是管理员路由
  if (to.matched.some(record => record.path.startsWith('/admin')) && 
      to.matched.some(record => record.meta.requiresAdmin)) {
    // 检查管理员状态
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    
    // 检查会话时间 - 超过2小时自动登出
    const loginTime = localStorage.getItem('adminLoginTime')
    const currentTime = Date.now()
    const SESSION_TIMEOUT = 2 * 60 * 60 * 1000 // 2小时
    
    // 如果登录时间不存在或者会话已过期，清除登录状态
    if (!loginTime || (currentTime - parseInt(loginTime)) > SESSION_TIMEOUT) {
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('adminLoginTime')
      next({ path: '/admin/login' })
      return
    }
    
    if (!isAdmin) {
      // 如果不是管理员，重定向到登录页
      next({ path: '/admin/login' })
    } else {
      // 更新登录时间，延长会话
      localStorage.setItem('adminLoginTime', currentTime.toString())
      next()
    }
  } else {
    next()
  }
})

export default router 