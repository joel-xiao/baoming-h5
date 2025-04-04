const { validationResult } = require('express-validator');
const logger = require('../../core/utils/Logger');

/**
 * 验证中间件
 * 使用express-validator验证请求数据
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // 执行所有验证规则
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // 获取验证结果
    const errors = validationResult(req);
    
    // 如果有错误，返回400状态码和错误信息
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => {
        // 使用嵌套的location信息（如果可用）
        const param = err.path || err.param;
        return `${param}: ${err.msg}`;
      });
      
      logger.warn(`请求验证失败: ${errorMessages.join(', ')}`);
      
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: errorMessages
      });
    }
    
    // 验证通过，继续下一个中间件
    next();
  };
};

/**
 * 通用验证错误处理
 * 处理验证错误并返回适当的响应
 */
const handleValidationError = (err, req, res, next) => {
  // 检查是否为验证错误
  if (err && err.name === 'ValidationError') {
    logger.warn(`验证错误: ${err.message}`);
    
    return res.status(400).json({
      success: false,
      message: '请求数据验证失败',
      errors: [err.message]
    });
  }
  
  // 继续到下一个中间件
  next(err);
};

/**
 * 验证请求体不为空
 */
const validateRequestBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: '请求体不能为空'
    });
  }
  
  next();
};

/**
 * 限制请求字段
 * 确保请求只包含允许的字段
 */
const allowFields = (allowedFields) => {
  return (req, res, next) => {
    const requestFields = Object.keys(req.body);
    
    // 检查是否有不允许的字段
    const invalidFields = requestFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: '请求包含不允许的字段',
        errors: invalidFields.map(field => `不允许的字段: ${field}`)
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  handleValidationError,
  validateRequestBody,
  allowFields
}; 