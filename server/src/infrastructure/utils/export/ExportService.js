const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const path = require('path');
const csv = require('fast-csv');
const { Parser } = require('json2csv');
const appConfig = require('../../../config/app');
const logger = require('../helper/Logger');

/**
 * 导出服务类
 * 处理数据导出为各种格式
 */
class ExportService {
  constructor() {
    // 确保临时目录存在
    this.tempDir = path.join(process.cwd(), 'temp');
    fs.ensureDirSync(this.tempDir);
  }
  
  /**
   * 导出注册数据
   * @param {Array} registrations 注册记录数组
   * @param {string} format 导出格式 (xlsx, csv, json)
   * @returns {Object} 包含数据、文件名和Content-Type的对象
   */
  async exportRegistrations(registrations, format = 'xlsx') {
    try {
      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `registrations-${timestamp}.${format}`;
      const filePath = path.join(this.tempDir, filename);
      
      // 准备数据
      const data = registrations.map(reg => {
        const regData = {
          '团队名称': reg.teamName,
          '领队姓名': reg.leader.name,
          '领队手机': reg.leader.phone,
          '领队邮箱': reg.leader.email,
          '领队单位': reg.leader.organization,
          '团队成员数': reg.members ? reg.members.length : 0,
          '状态': reg.status,
          '创建时间': reg.createdAt,
          '审核时间': reg.reviewedAt || '',
          '备注': reg.remarks || '',
          '拒绝原因': reg.rejectReason || ''
        };
        
        // 添加付款状态
        if (reg.paymentStatus) {
          regData['付款状态'] = reg.paymentStatus;
          regData['付款时间'] = reg.paidAt || '';
          regData['付款金额'] = reg.paidAmount || 0;
        }
        
        return regData;
      });
      
      // 根据格式导出
      switch (format.toLowerCase()) {
        case 'xlsx':
          return await this.exportToExcel(data, filePath, '注册记录');
        case 'csv':
          return await this.exportToCsv(data, filePath);
        case 'json':
          return await this.exportToJson(data, filePath);
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }
    } catch (error) {
      logger.error(`导出注册数据错误: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 导出支付数据
   * @param {Array} payments 支付记录数组
   * @param {string} format 导出格式 (xlsx, csv, json)
   * @returns {Object} 包含数据、文件名和Content-Type的对象
   */
  async exportPayments(payments, format = 'xlsx') {
    try {
      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `payments-${timestamp}.${format}`;
      const filePath = path.join(this.tempDir, filename);
      
      // 准备数据
      const data = payments.map(payment => {
        return {
          '订单号': payment.orderNumber,
          '注册ID': payment.registrationId,
          '团队名称': payment.teamName,
          '付款人': payment.payerName,
          '付款方式': payment.paymentMethod,
          '付款金额': payment.amount,
          '付款状态': payment.status,
          '创建时间': payment.createdAt,
          '完成时间': payment.completedAt || '',
          '交易流水号': payment.transactionId || '',
          '备注': payment.remarks || ''
        };
      });
      
      // 根据格式导出
      switch (format.toLowerCase()) {
        case 'xlsx':
          return await this.exportToExcel(data, filePath, '支付记录');
        case 'csv':
          return await this.exportToCsv(data, filePath);
        case 'json':
          return await this.exportToJson(data, filePath);
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }
    } catch (error) {
      logger.error(`导出支付数据错误: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 导出为Excel格式
   * @param {Array} data 数据数组
   * @param {string} filePath 文件路径
   * @param {string} sheetName 工作表名称
   * @returns {Object} 包含数据、文件名和Content-Type的对象
   */
  async exportToExcel(data, filePath, sheetName = 'Sheet1') {
    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // 设置表头
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.columns = headers.map(header => {
        return { header, key: header, width: 20 };
      });
      
      // 添加数据
      data.forEach(row => {
        worksheet.addRow(row);
      });
      
      // 设置表头样式
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    }
    
    // 写入文件
    await workbook.xlsx.writeFile(filePath);
    
    // 读取文件内容
    const fileData = fs.readFileSync(filePath);
    
    // 删除临时文件
    fs.removeSync(filePath);
    
    return {
      data: fileData,
      filename: path.basename(filePath),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }
  
  /**
   * 导出为CSV格式
   * @param {Array} data 数据数组
   * @param {string} filePath 文件路径
   * @returns {Object} 包含数据、文件名和Content-Type的对象
   */
  async exportToCsv(data, filePath) {
    return new Promise((resolve, reject) => {
      try {
        const parser = new Parser({
          fields: data.length > 0 ? Object.keys(data[0]) : []
        });
        
        const csvData = parser.parse(data);
        fs.writeFileSync(filePath, csvData);
        
        // 读取文件内容
        const fileData = fs.readFileSync(filePath);
        
        // 删除临时文件
        fs.removeSync(filePath);
        
        resolve({
          data: fileData,
          filename: path.basename(filePath),
          contentType: 'text/csv'
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 导出为JSON格式
   * @param {Array} data 数据数组
   * @param {string} filePath 文件路径
   * @returns {Object} 包含数据、文件名和Content-Type的对象
   */
  async exportToJson(data, filePath) {
    // 写入文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    // 读取文件内容
    const fileData = fs.readFileSync(filePath);
    
    // 删除临时文件
    fs.removeSync(filePath);
    
    return {
      data: fileData,
      filename: path.basename(filePath),
      contentType: 'application/json'
    };
  }
}

module.exports = ExportService;