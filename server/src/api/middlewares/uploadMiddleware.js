const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const logger = require('../../core/utils/Logger');
const { ResponseUtil } = require('../../core/utils/ResponseUtil');
const appConfig = require('../../config/app');

// 确保上传目录存在
const uploadDir = appConfig.upload.directory || path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadDir);

// 按日期创建目录结构
const getUploadPath = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const dirPath = path.join(uploadDir, String(year), month, day);
  fs.ensureDirSync(dirPath);
  
  return dirPath;
};

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath();
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成随机文件名，避免文件名冲突
    const randomString = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${timestamp}-${randomString}${fileExt}`;
    
    cb(null, fileName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = appConfig.upload.allowedTypes.split(',');
  const fileExt = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = allowedTypes.map(type => `.${type.trim()}`);
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    logger.warn(`拒绝上传不允许的文件类型: ${fileExt}, 原始文件名: ${file.originalname}`);
    cb(new Error(`不支持的文件类型。允许的类型: ${allowedTypes.join(', ')}`), false);
  }
};

// 基本上传配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(appConfig.upload.maxSize) * 1024 * 1024, // MB to bytes
    files: 5 // 每次请求最多上传5个文件
  }
});

/**
 * 单文件上传中间件
 * 处理单个文件上传
 */
const singleUpload = (fieldName = 'file') => {
  return (req, res, next) => {
    const uploadHandler = upload.single(fieldName);
    
    uploadHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Multer错误
          if (err.code === 'LIMIT_FILE_SIZE') {
            return ResponseUtil.badRequest(res, 
              `文件大小超出限制 (最大 ${appConfig.upload.maxSize}MB)`);
          }
          
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return ResponseUtil.badRequest(res, 
              `意外的字段名: ${err.field}`);
          }
          
          return ResponseUtil.badRequest(res, 
            `文件上传错误: ${err.message}`);
        }
        
        // 其他错误
        return ResponseUtil.badRequest(res, err.message);
      }
      
      // 如果成功上传，添加完整URL到文件对象
      if (req.file) {
        // 获取相对路径（从uploads目录开始）
        const relativePath = path.relative(uploadDir, req.file.path).replace(/\\/g, '/');
        const baseUrl = appConfig.upload.baseUrl || `${req.protocol}://${req.get('host')}/uploads`;
        
        req.file.url = `${baseUrl}/${relativePath}`;
        
        logger.info(`文件上传成功: ${req.file.originalname} -> ${req.file.filename}`);
      }
      
      next();
    });
  };
};

/**
 * 多文件上传中间件
 * 处理多个文件上传
 */
const multiUpload = (fieldName = 'files', maxCount = 5) => {
  return (req, res, next) => {
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Multer错误
          if (err.code === 'LIMIT_FILE_SIZE') {
            return ResponseUtil.badRequest(res, 
              `文件大小超出限制 (最大 ${appConfig.upload.maxSize}MB)`);
          }
          
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return ResponseUtil.badRequest(res, 
              `意外的字段名或文件数量超出限制`);
          }
          
          return ResponseUtil.badRequest(res, 
            `文件上传错误: ${err.message}`);
        }
        
        // 其他错误
        return ResponseUtil.badRequest(res, err.message);
      }
      
      // 如果成功上传，添加完整URL到每个文件对象
      if (req.files && req.files.length > 0) {
        const baseUrl = appConfig.upload.baseUrl || `${req.protocol}://${req.get('host')}/uploads`;
        
        req.files.forEach(file => {
          const relativePath = path.relative(uploadDir, file.path).replace(/\\/g, '/');
          file.url = `${baseUrl}/${relativePath}`;
        });
        
        logger.info(`多文件上传成功: ${req.files.length} 个文件已上传`);
      }
      
      next();
    });
  };
};

/**
 * 字段文件上传中间件
 * 处理多个不同字段的文件上传
 */
const fieldsUpload = (fields) => {
  return (req, res, next) => {
    const uploadHandler = upload.fields(fields);
    
    uploadHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Multer错误
          if (err.code === 'LIMIT_FILE_SIZE') {
            return ResponseUtil.badRequest(res, 
              `文件大小超出限制 (最大 ${appConfig.upload.maxSize}MB)`);
          }
          
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return ResponseUtil.badRequest(res, 
              `意外的字段名或文件数量超出限制`);
          }
          
          return ResponseUtil.badRequest(res, 
            `文件上传错误: ${err.message}`);
        }
        
        // 其他错误
        return ResponseUtil.badRequest(res, err.message);
      }
      
      // 如果成功上传，添加完整URL到每个文件对象
      if (req.files) {
        const baseUrl = appConfig.upload.baseUrl || `${req.protocol}://${req.get('host')}/uploads`;
        let totalFiles = 0;
        
        Object.keys(req.files).forEach(fieldName => {
          req.files[fieldName].forEach(file => {
            const relativePath = path.relative(uploadDir, file.path).replace(/\\/g, '/');
            file.url = `${baseUrl}/${relativePath}`;
            totalFiles++;
          });
        });
        
        logger.info(`多字段文件上传成功: ${totalFiles} 个文件已上传`);
      }
      
      next();
    });
  };
};

module.exports = {
  singleUpload,
  multiUpload,
  fieldsUpload,
  uploadDir
}; 