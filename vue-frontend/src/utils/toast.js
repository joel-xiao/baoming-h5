import { createApp } from 'vue';
import MessageToastComponent from '../components/Toast.vue';

// 懒加载方式创建 Toast 实例
let instance = null;

/**
 * 获取或创建 Toast 实例
 * @returns {Object} Toast组件实例
 */
const getInstance = () => {
  if (instance) return instance;
  
  // 创建Vue 3实例
  const app = createApp(MessageToastComponent);
  const mountEl = document.createElement('div');
  document.body.appendChild(mountEl);
  instance = app.mount(mountEl);
  
  return instance;
};

/**
 * 显示Toast提示
 * @param {string} message - 要显示的消息
 * @param {number} duration - 显示持续时间，默认3000ms
 * @param {string} type - 提示类型，可选值：default, success, error, warning
 */
export const toast = (message, duration = 3000, type = 'default') => {
  const inst = getInstance();
  inst.show(message, duration, type);
};

/**
 * 成功提示
 * @param {string} message - 要显示的消息
 * @param {number} duration - 显示持续时间，默认3000ms
 */
export const success = (message, duration = 3000) => {
  toast(message, duration, 'success');
};

/**
 * 错误提示
 * @param {string} message - 要显示的消息
 * @param {number} duration - 显示持续时间，默认3000ms
 */
export const error = (message, duration = 3000) => {
  toast(message, duration, 'error');
};

/**
 * 警告提示
 * @param {string} message - 要显示的消息
 * @param {number} duration - 显示持续时间，默认3000ms
 */
export const warning = (message, duration = 3000) => {
  toast(message, duration, 'warning');
};

export default {
  toast,
  success,
  error,
  warning
}; 