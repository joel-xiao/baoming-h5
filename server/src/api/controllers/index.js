// 导入所有控制器
const authController = require('./authController');
const adminController = require('./adminController');
const registrationController = require('./registrationController');
const paymentController = require('./paymentController');

// 导出所有控制器
module.exports = {
  authController,
  adminController,
  registrationController,
  paymentController
}; 