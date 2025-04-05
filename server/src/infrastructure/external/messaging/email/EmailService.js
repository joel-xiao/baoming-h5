const nodemailer = require('nodemailer');
const appConfig = require('@config/app');

/**
 * 邮件服务类
 * 提供邮件发送相关功能
 */
class EmailService {
  /**
   * 构造函数
   * @param {Object} logger - 日志服务
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * 创建邮件发送器
   * @private
   * @returns {Object} 邮件传输器
   */
  createTransporter() {
    // 开发环境使用Ethereal测试账户
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_EMAIL || 'ethereal.user@ethereal.email',
          pass: process.env.ETHEREAL_PASSWORD || 'ethereal_password'
        }
      });
    }
    
    // 生产环境使用配置的SMTP服务器
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * 发送邮件
   * @param {Object} options 邮件选项
   * @param {string} options.to 收件人
   * @param {string} options.subject 邮件主题
   * @param {string} options.text 纯文本内容
   * @param {string} options.html HTML内容
   * @returns {Promise<Object>} 发送结果
   */
  async sendEmail(options) {
    try {
      const transporter = this.createTransporter();
      
      // 设置邮件选项
      const mailOptions = {
        from: `${appConfig.name} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };
      
      // 添加抄送和密送（如果提供）
      if (options.cc) mailOptions.cc = options.cc;
      if (options.bcc) mailOptions.bcc = options.bcc;
      
      // 添加附件（如果提供）
      if (options.attachments) mailOptions.attachments = options.attachments;
      
      // 发送邮件
      const info = await transporter.sendMail(mailOptions);
      
      // 开发环境显示预览URL
      if (process.env.NODE_ENV === 'development' && info.messageId) {
        this.logger.info(`邮件发送成功: ${info.messageId}`);
        if (nodemailer.getTestMessageUrl(info)) {
          this.logger.info(`邮件预览: ${nodemailer.getTestMessageUrl(info)}`);
        }
      } else {
        this.logger.info(`邮件发送成功: ${info.messageId}`);
      }
      
      return info;
    } catch (error) {
      this.logger.error(`邮件发送失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 发送模板邮件
   * @param {Object} options 邮件选项
   * @param {string} options.to 收件人
   * @param {string} options.subject 邮件主题
   * @param {string} options.template 模板名称
   * @param {Object} options.data 模板数据
   * @returns {Promise<Object>} 发送结果
   */
  async sendTemplateEmail(options) {
    try {
      // 这里可以实现邮件模板系统
      // 简单起见，我们现在只使用基本的发送功能
      
      // 返回基本邮件发送
      return await this.sendEmail(options);
    } catch (error) {
      this.logger.error(`模板邮件发送失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 发送多收件人邮件
   * @param {Object} options 邮件选项
   * @param {Array<string>} options.to 收件人数组
   * @param {string} options.subject 邮件主题
   * @param {string} options.text 纯文本内容
   * @param {string} options.html HTML内容
   * @param {boolean} options.individually 是否单独发送给每个收件人
   * @returns {Promise<Array<Object>>} 发送结果数组
   */
  async sendBulkEmail(options) {
    try {
      // 检查是否要单独发送给每个收件人
      if (options.individually) {
        const results = [];
        
        // 单独发送给每个收件人
        for (const recipient of options.to) {
          const individualOptions = { ...options, to: recipient };
          const result = await this.sendEmail(individualOptions);
          results.push(result);
        }
        
        return results;
      } else {
        // 批量发送给所有收件人
        return [await this.sendEmail(options)];
      }
    } catch (error) {
      this.logger.error(`批量邮件发送失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EmailService; 