import { createApp } from 'vue';
import MessageToastComponent from '../components/Toast.vue';

// 创建Vue 3实例
const app = createApp(MessageToastComponent);
const mountEl = document.createElement('div');
document.body.appendChild(mountEl);
const instance = app.mount(mountEl);

/**
 * 显示Toast提示
 * @param {string} message - 要显示的消息
 * @param {number} duration - 显示持续时间，默认3000ms
 * @param {string} type - 提示类型，可选值：default, success, error, warning
 */
export const toast = (message, duration = 3000, type = 'default') => {
  instance.show(message, duration, type);
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