# 团队报名系统前端

本项目是团队报名系统的前端部分，基于Vue 3构建，提供完整的用户界面及交互功能。

## 特点

- 基于Vue 3和Vite构建
- 使用Pinia进行状态管理
- Vue Router管理路由
- 响应式设计，支持移动端和桌面端
- 使用Element Plus组件库
- 基于Axios的API请求模块化封装

## 安装与运行

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 生产环境构建
npm run build

# 预览生产构建
npm run preview
```

## 环境变量配置

在项目根目录创建以下文件：

**.env.development**：开发环境配置
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=团队报名系统(开发环境)
```

**.env.production**：生产环境配置
```
VITE_API_BASE_URL=/api
VITE_APP_TITLE=团队报名系统
```

## 核心功能

### 用户端

1. **报名流程**
   - 队长创建团队
   - 队员加入团队
   - 查看团队状态
   - 编辑信息
   - 支付费用

2. **支付功能**
   - 支持微信支付和支付宝
   - 支付状态实时更新
   - 支付结果通知

3. **个人中心**
   - 查看报名状态
   - 查看支付记录
   - 修改个人信息
   - 团队信息查看

### 管理端

1. **数据管理**
   - 报名数据查看
   - 用户管理
   - 团队管理
   - 支付记录查询

2. **数据导出**
   - Excel导出功能
   - 自定义导出字段
   - 批量数据处理

3. **系统设置**
   - 报名表单配置
   - 系统参数设置
   - 支付配置

## 项目结构

```
client/
├── public/             # 静态资源
├── src/                # 源代码
│   ├── api/            # API请求
│   │   ├── modules/    # 按模块划分的API
│   │   │   ├── auth.js     # 认证相关
│   │   │   ├── registration.js # 报名相关
│   │   │   └── payment.js  # 支付相关
│   │   └── index.js    # API统一出口
│   ├── assets/         # 资源文件
│   │   ├── images/     # 图片
│   │   └── styles/     # 样式文件
│   ├── components/     # 通用组件
│   │   ├── common/     # 基础组件
│   │   ├── form/       # 表单组件
│   │   └── layout/     # 布局组件
│   ├── composables/    # 组合式API
│   ├── hooks/          # 自定义Hooks
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia状态管理
│   │   ├── modules/    # 模块化的store
│   │   └── index.js    # store入口
│   ├── utils/          # 工具函数
│   │   ├── request.js  # Axios封装
│   │   ├── validator.js # 表单验证
│   │   └── storage.js  # 本地存储
│   ├── views/          # 页面视图
│   │   ├── admin/      # 管理员页面
│   │   ├── auth/       # 认证页面
│   │   ├── registration/ # 报名页面
│   │   └── payment/    # 支付页面
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── .env.development    # 开发环境变量
├── .env.production     # 生产环境变量
├── index.html          # HTML模板
├── vite.config.js      # Vite配置
└── package.json        # 项目依赖
```

## API模块示例

```javascript
// src/api/modules/registration.js
import request from '@/utils/request';

// 创建队长报名
export function createLeaderRegistration(data) {
  return request({
    url: '/registration/leader',
    method: 'post',
    data
  });
}

// 加入团队
export function joinTeam(data) {
  return request({
    url: '/registration/join',
    method: 'post',
    data
  });
}

// 获取团队信息
export function getTeamInfo(teamId) {
  return request({
    url: `/registration/team/${teamId}`,
    method: 'get'
  });
}

// 编辑报名信息
export function updateRegistration(id, data) {
  return request({
    url: `/registration/${id}`,
    method: 'put',
    data
  });
}
```

## Axios封装

```javascript
// src/utils/request.js
import axios from 'axios';
import { useUserStore } from '@/stores/modules/user';
import router from '@/router';
import { ElMessage } from 'element-plus';

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore();
    const token = userStore.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 如果返回的状态码不是200，说明接口请求有误
    if (!res.success) {
      ElMessage.error(res.message || '请求失败');
      
      // 401: Token过期或未登录
      if (res.code === 401) {
        // 跳转到登录页
        router.push('/login');
      }
      
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    
    return res;
  },
  error => {
    ElMessage.error(error.message || '请求失败');
    return Promise.reject(error);
  }
);

export default service;
```

## 状态管理示例

```javascript
// src/stores/modules/registration.js
import { defineStore } from 'pinia';
import { 
  createLeaderRegistration, 
  joinTeam, 
  getTeamInfo 
} from '@/api/modules/registration';

export const useRegistrationStore = defineStore('registration', {
  state: () => ({
    teamInfo: null,
    members: [],
    loading: false,
    error: null
  }),
  
  getters: {
    teamId: state => state.teamInfo?.id,
    teamStatus: state => state.teamInfo?.status,
    isPaid: state => state.teamInfo?.isPaid,
    memberCount: state => state.members.length
  },
  
  actions: {
    // 创建队长报名
    async createTeam(leaderData) {
      this.loading = true;
      this.error = null;
      
      try {
        const res = await createLeaderRegistration(leaderData);
        this.teamInfo = res.data;
        return res.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 加入团队
    async joinTeam(memberData) {
      this.loading = true;
      this.error = null;
      
      try {
        const res = await joinTeam(memberData);
        await this.fetchTeamMembers(memberData.teamId);
        return res.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 获取团队成员
    async fetchTeamMembers(teamId) {
      this.loading = true;
      this.error = null;
      
      try {
        const res = await getTeamInfo(teamId);
        this.teamInfo = res.data.team;
        this.members = res.data.members;
        return res.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 重置状态
    resetState() {
      this.teamInfo = null;
      this.members = [];
      this.loading = false;
      this.error = null;
    }
  }
});
```

## 路由配置

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/modules/user';

const routes = [
  {
    path: '/',
    component: () => import('@/views/layout/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', public: true }
      },
      {
        path: 'registration',
        name: 'Registration',
        component: () => import('@/views/registration/index.vue'),
        meta: { title: '报名' }
      },
      {
        path: 'registration/leader',
        name: 'LeaderRegistration',
        component: () => import('@/views/registration/leader.vue'),
        meta: { title: '队长报名' }
      },
      {
        path: 'registration/join/:teamId',
        name: 'JoinTeam',
        component: () => import('@/views/registration/join.vue'),
        meta: { title: '加入团队' }
      },
      {
        path: 'payment/:orderId',
        name: 'Payment',
        component: () => import('@/views/payment/index.vue'),
        meta: { title: '支付' }
      },
      {
        path: 'personal',
        name: 'Personal',
        component: () => import('@/views/personal/index.vue'),
        meta: { title: '个人中心', requireAuth: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/views/layout/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requireAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/admin/dashboard.vue'),
        meta: { title: '控制台' }
      },
      {
        path: 'registrations',
        name: 'RegistrationManagement',
        component: () => import('@/views/admin/registrations.vue'),
        meta: { title: '报名管理' }
      },
      {
        path: 'payments',
        name: 'PaymentManagement',
        component: () => import('@/views/admin/payments.vue'),
        meta: { title: '支付管理' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/admin/settings.vue'),
        meta: { title: '系统设置' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', public: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  // 设置页面标题
  document.title = `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE}`;
  
  // 检查是否需要登录权限
  if (to.meta.requireAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requireAdmin && !userStore.isAdmin) {
    next({ name: 'Home' });
    return;
  }
  
  next();
});

export default router;
```

## 组件示例：表单组件

```vue
<!-- src/components/form/RegistrationForm.vue -->
<template>
  <div class="registration-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>
      
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号" />
      </el-form-item>
      
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      
      <el-form-item label="学校" prop="school">
        <el-input v-model="form.school" placeholder="请输入学校名称" />
      </el-form-item>
      
      <el-form-item label="学号" prop="studentId">
        <el-input v-model="form.studentId" placeholder="请输入学号" />
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading">
          {{ submitButtonText }}
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  initialValues: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'leader', // leader 或 member
    validator: (value) => ['leader', 'member'].includes(value)
  }
});

const emit = defineEmits(['submit', 'reset']);

const submitButtonText = computed(() => {
  return props.type === 'leader' ? '创建团队' : '加入团队';
});

const form = ref({
  name: props.initialValues.name || '',
  phone: props.initialValues.phone || '',
  email: props.initialValues.email || '',
  school: props.initialValues.school || '',
  studentId: props.initialValues.studentId || ''
});

const formRef = ref(null);

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  school: [
    { required: true, message: '请输入学校名称', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ]
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit('submit', { ...form.value });
    } else {
      ElMessage.error('表单验证失败，请检查填写内容');
      console.log('验证失败的字段:', fields);
    }
  });
};

// 重置表单
const handleReset = () => {
  if (!formRef.value) return;
  
  formRef.value.resetFields();
  emit('reset');
};
</script>

<style scoped>
.registration-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}
</style>
```

## 常见问题

### 1. 如何处理登录态过期？

系统使用axios拦截器检测401错误，自动跳转到登录页面。登录成功后会重定向回原来的页面。

### 2. 如何在部署时修改API地址？

- 编辑`.env.production`文件中的`VITE_API_BASE_URL`变量
- 或在Nginx配置中设置代理，将API请求转发到后端服务器

### 3. 如何扩展表单字段？

报名表单是动态渲染的，可以通过修改`src/config/formConfig.js`文件来添加或修改表单字段，无需修改代码逻辑。

### 4. 如何添加新支付方式？

1. 在`src/api/modules/payment.js`中添加新的支付API
2. 在`src/components/payment/PaymentMethods.vue`中添加新的支付方式组件
3. 在`src/views/payment/index.vue`中更新支付方式选择逻辑

### 5. 后台权限如何控制？

1. 用户登录时获取权限信息，存储在Pinia的userStore中
2. 路由守卫检查用户访问的路由是否需要特定权限
3. 组件内部使用`v-if`指令根据用户权限条件性渲染内容

## 开发规范

1. **命名规范**
   - 组件名使用PascalCase（如`TeamInfoCard.vue`）
   - 方法和变量使用camelCase（如`getUserInfo`）
   - 常量使用UPPER_SNAKE_CASE（如`API_BASE_URL`）

2. **样式规范**
   - 使用scoped CSS确保样式不会泄漏
   - 全局样式放在`src/assets/styles`目录
   - 使用SCSS变量管理颜色和尺寸

3. **提交规范**
   - feat: 新功能
   - fix: 修复bug
   - docs: 文档更新
   - style: 代码格式修改
   - refactor: 代码重构
   - perf: 性能优化
   - test: 测试代码

## 性能优化

1. **路由懒加载**
   所有路由都使用动态import实现懒加载，减少首屏加载时间

2. **组件异步加载**
   ```javascript
   const AsyncComponent = defineAsyncComponent(() => 
     import('@/components/HeavyComponent.vue')
   );
   ```

3. **大数据列表虚拟滚动**
   使用`vue-virtual-scroller`处理长列表，减少DOM渲染

4. **图片懒加载**
   使用`v-lazy`指令延迟加载图片，提高页面初始化速度

## 浏览器兼容性

- 支持所有现代浏览器（Chrome, Firefox, Safari, Edge）
- 不支持IE浏览器
- 使用`browserslist`配置兼容目标：
  ```
  > 1%
  last 2 versions
  not dead
  not ie 11
  ``` 