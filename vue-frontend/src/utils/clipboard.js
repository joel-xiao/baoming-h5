/**
 * 剪贴板操作工具函数
 */

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export const copyToClipboard = async (text) => {
  try {
    // 优先使用现代的Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 回退方法：创建临时元素
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 确保元素不可见
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // 选中文本并复制
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    
    // 清理DOM
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
}; 