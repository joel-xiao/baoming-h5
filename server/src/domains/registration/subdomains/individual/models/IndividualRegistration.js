const Registration = require('../../../models/Registration');

/**
 * 个人报名模型
 * 扩展基础的报名模型，增加个人报名特有的字段和验证规则
 */
class IndividualRegistration extends Registration {
  /**
   * 构造函数
   * @param {Object} data - 个人报名数据
   */
  constructor(data) {
    // 调用父类构造函数
    super(data);
    
    // 标记为个人报名
    this.isIndividual = true;
    
    // 个人报名特有的字段
    this.personalInfo = {
      idCardType: data.idCardType || '身份证',
      idCardNumber: data.idCardNumber || '',
      emergencyContact: data.emergencyContact || '',
      emergencyPhone: data.emergencyPhone || '',
      medicalHistory: data.medicalHistory || '',
      ...data.personalInfo
    };
    
    // 个人报名特有的配置
    this.individualConfig = {
      requiresMedicalCheck: data.requiresMedicalCheck || false,
      category: data.category || 'standard',
      isVIP: data.isVIP || false,
      ...data.individualConfig
    };
  }
  
  /**
   * 验证个人报名数据
   * @returns {Object} 验证结果 {isValid, errors}
   */
  validate() {
    // 首先调用父类的验证方法
    const baseValidation = super.validate();
    
    // 如果基础验证失败，直接返回
    if (!baseValidation.isValid) {
      return baseValidation;
    }
    
    // 个人报名特有的验证规则
    const errors = [];
    
    // 验证个人信息中的必填字段
    if (this.individualConfig.requiresMedicalCheck && !this.personalInfo.medicalHistory) {
      errors.push('需要填写病史信息');
    }
    
    // 验证紧急联系人信息
    if (!this.personalInfo.emergencyContact || !this.personalInfo.emergencyPhone) {
      errors.push('需要填写紧急联系人信息');
    }
    
    // 验证证件号码 (如果提供了)
    if (this.personalInfo.idCardNumber) {
      if (this.personalInfo.idCardType === '身份证' && !/^\d{17}[\dXx]$/.test(this.personalInfo.idCardNumber)) {
        errors.push('身份证号码格式不正确');
      }
    }
    
    // 返回验证结果
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 序列化为JSON
   * @returns {Object} 序列化后的对象
   */
  toJSON() {
    const json = super.toJSON();
    
    // 添加个人报名特有的字段
    return {
      ...json,
      isIndividual: this.isIndividual,
      personalInfo: this.personalInfo,
      individualConfig: this.individualConfig
    };
  }
}

module.exports = IndividualRegistration; 