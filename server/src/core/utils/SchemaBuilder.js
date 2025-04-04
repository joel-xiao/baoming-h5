const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { dbType, sequelize, DATA_DIR } = require('../db/Database');

/**
 * 字段类型映射器
 * 负责将通用字段类型映射到不同数据库实现的具体类型
 */
class FieldTypeMapper {
  /**
   * 将通用字段类型映射到 MongoDB/Mongoose 类型
   * @param {Object} fieldDefinition - 字段定义
   * @returns {Object} Mongoose 类型定义
   */
  static toMongoose(fieldDefinition) {
    const { type, required, default: defaultValue, unique, ...rest } = fieldDefinition;
    
    let mongooseType;
    
    switch (type) {
      case 'string':
        mongooseType = String;
        break;
      case 'number':
        mongooseType = Number;
        break;
      case 'boolean':
        mongooseType = Boolean;
        break;
      case 'date':
        mongooseType = Date;
        break;
      case 'objectId':
        mongooseType = mongoose.Schema.Types.ObjectId;
        break;
      case 'array':
        mongooseType = [rest.of ? this.toMongoose({ type: rest.of }).type : mongoose.Schema.Types.Mixed];
        break;
      case 'object':
        mongooseType = mongoose.Schema.Types.Mixed;
        break;
      default:
        mongooseType = mongoose.Schema.Types.Mixed;
    }
    
    const mongooseField = {
      type: mongooseType,
      required: !!required,
      default: defaultValue,
      unique: !!unique,
      ...rest
    };
    
    // 移除未定义的属性
    Object.keys(mongooseField).forEach(key => {
      if (mongooseField[key] === undefined) {
        delete mongooseField[key];
      }
    });
    
    return mongooseField;
  }
  
  /**
   * 将通用字段类型映射到 MySQL/Sequelize 类型
   * @param {Object} fieldDefinition - 字段定义
   * @returns {Object} Sequelize 类型定义
   */
  static toSequelize(fieldDefinition) {
    const { type, required, default: defaultValue, unique, ...rest } = fieldDefinition;
    
    let sequelizeType;
    
    switch (type) {
      case 'string':
        sequelizeType = rest.length ? DataTypes.STRING(rest.length) : DataTypes.STRING;
        break;
      case 'number':
        sequelizeType = rest.decimal ? DataTypes.DECIMAL(rest.precision || 10, rest.scale || 2) : DataTypes.INTEGER;
        break;
      case 'boolean':
        sequelizeType = DataTypes.BOOLEAN;
        break;
      case 'date':
        sequelizeType = DataTypes.DATE;
        break;
      case 'objectId':
        sequelizeType = DataTypes.UUID;
        break;
      case 'array':
        sequelizeType = DataTypes.JSON;
        break;
      case 'object':
        sequelizeType = DataTypes.JSON;
        break;
      default:
        sequelizeType = DataTypes.STRING;
    }
    
    const sequelizeField = {
      type: sequelizeType,
      allowNull: !required,
      defaultValue: defaultValue,
      unique: !!unique,
      ...rest
    };
    
    // 移除未定义的属性
    Object.keys(sequelizeField).forEach(key => {
      if (sequelizeField[key] === undefined) {
        delete sequelizeField[key];
      }
    });
    
    return sequelizeField;
  }
  
  /**
   * 将通用字段类型映射到文件系统存储的验证函数
   * @param {Object} fieldDefinition - 字段定义
   * @returns {Function} 用于验证字段的函数
   */
  static toFileSystem(fieldDefinition) {
    const { type, required, default: defaultValue, ...rest } = fieldDefinition;
    
    // 返回验证函数
    return {
      validate: value => {
        // 检查必填
        if (required && (value === undefined || value === null)) {
          return { valid: false, message: '字段为必填项' };
        }
        
        // 如果值为空且有默认值，使用默认值
        if ((value === undefined || value === null) && defaultValue !== undefined) {
          return { valid: true, value: defaultValue };
        }
        
        // 根据类型验证
        switch (type) {
          case 'string':
            if (value !== undefined && typeof value !== 'string') {
              return { valid: false, message: '字段必须是字符串类型' };
            }
            // 检查字符串长度
            if (rest.length && value && value.length > rest.length) {
              return { valid: false, message: `字符串长度不能超过${rest.length}` };
            }
            break;
          case 'number':
            if (value !== undefined && typeof value !== 'number') {
              return { valid: false, message: '字段必须是数字类型' };
            }
            break;
          case 'boolean':
            if (value !== undefined && typeof value !== 'boolean') {
              return { valid: false, message: '字段必须是布尔类型' };
            }
            break;
          case 'date':
            if (value !== undefined && !(value instanceof Date) && isNaN(Date.parse(value))) {
              return { valid: false, message: '字段必须是有效的日期' };
            }
            break;
          case 'objectId':
            // 简单验证是否为有效的 UUID
            if (value !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
              return { valid: false, message: '字段必须是有效的 UUID' };
            }
            break;
          case 'array':
            if (value !== undefined && !Array.isArray(value)) {
              return { valid: false, message: '字段必须是数组类型' };
            }
            break;
          case 'object':
            if (value !== undefined && (typeof value !== 'object' || Array.isArray(value))) {
              return { valid: false, message: '字段必须是对象类型' };
            }
            break;
        }
        
        // 通过验证
        return { valid: true, value };
      },
      defaultValue
    };
  }
}

/**
 * Schema 构建器
 * 提供从统一字段定义构建不同数据库模型的方法
 */
class SchemaBuilder {
  /**
   * 创建模型
   * @param {String} modelName - 模型名称
   * @param {Object} fields - 字段定义
   * @param {Object} options - 其他选项(方法、索引等)
   * @returns {Object} 适用于不同数据库的模型定义
   */
  static createModel(modelName, fields, options = {}) {
    const { methods = {}, statics = {} } = options;
    
    // 创建 MongoDB 模型
    const mongooseSchema = this._createMongooseModel(modelName, fields, options);
    
    // 创建 MySQL 模型
    const sequelizeModel = this._createSequelizeModel(modelName, fields, options);
    
    // 创建文件系统模型
    const fileSystemModel = this._createFileSystemModel(modelName, fields, options);
    
    // 返回不同数据库类型的模型定义
    return {
      mongodb: mongooseSchema,
      mysql: sequelizeModel,
      filesystem: fileSystemModel
    };
  }
  
  /**
   * 创建 MongoDB/Mongoose 模型
   * @param {String} modelName - 模型名称
   * @param {Object} fields - 字段定义
   * @param {Object} options - 其他选项(方法、索引等)
   * @returns {Object} Mongoose 模型
   */
  static _createMongooseModel(modelName, fields, options) {
    // 将通用字段定义转换为 Mongoose schema 定义
    const schemaDefinition = {};
    
    Object.keys(fields).forEach(fieldName => {
      schemaDefinition[fieldName] = FieldTypeMapper.toMongoose(fields[fieldName]);
    });
    
    // 创建 Mongoose schema
    const schema = new mongoose.Schema(schemaDefinition, {
      timestamps: true,
      collection: options.collection || modelName.toLowerCase() + 's',
      ...options.schemaOptions
    });
    
    // 添加实例方法
    if (options.methods) {
      Object.keys(options.methods).forEach(methodName => {
        schema.methods[methodName] = options.methods[methodName];
      });
    }
    
    // 添加静态方法
    if (options.statics) {
      Object.keys(options.statics).forEach(methodName => {
        schema.statics[methodName] = options.statics[methodName];
      });
    }
    
    // 添加索引
    if (options.indexes) {
      options.indexes.forEach(index => {
        schema.index(index.fields, index.options);
      });
    }
    
    // 添加钩子
    if (options.hooks) {
      Object.keys(options.hooks).forEach(hookName => {
        schema.pre(hookName, options.hooks[hookName]);
      });
    }
    
    // 创建模型
    return mongoose.model(modelName, schema);
  }
  
  /**
   * 创建 MySQL/Sequelize 模型
   * @param {String} modelName - 模型名称
   * @param {Object} fields - 字段定义
   * @param {Object} options - 其他选项(方法、索引等)
   * @returns {Object} Sequelize 模型
   */
  static _createSequelizeModel(modelName, fields, options) {
    // 将通用字段定义转换为 Sequelize 属性定义
    const attributes = {};
    
    // 添加id字段作为主键
    attributes['id'] = {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    };
    
    Object.keys(fields).forEach(fieldName => {
      attributes[fieldName] = FieldTypeMapper.toSequelize(fields[fieldName]);
    });
    
    // 创建 Sequelize 模型
    const model = sequelize.define(modelName, attributes, {
      tableName: options.tableName || modelName.toLowerCase() + 's',
      timestamps: true,
      ...options.modelOptions
    });
    
    // 添加钩子
    if (options.hooks) {
      // 钩子名称映射表 (MongoDB => Sequelize)
      const hookMapping = {
        'validate': 'beforeValidate',
        'save': 'beforeSave',
        'remove': 'beforeDestroy',
        'init': 'afterFind',
        'findOne': 'afterFind',
        'find': 'afterFind',
        'update': 'beforeUpdate'
      };
      
      // Sequelize支持的钩子名称
      const validHooks = [
        'beforeBulkCreate', 'beforeBulkDestroy', 'beforeBulkUpdate', 
        'beforeCreate', 'beforeDestroy', 'beforeSave', 'beforeUpdate', 'beforeUpsert', 'beforeValidate',
        'afterBulkCreate', 'afterBulkDestroy', 'afterBulkUpdate',
        'afterCreate', 'afterDestroy', 'afterSave', 'afterUpdate', 'afterUpsert', 'afterValidate',
        'afterFind'
      ];
      
      Object.keys(options.hooks).forEach(hookName => {
        // 映射MongoDB钩子名称到Sequelize钩子名称
        const sequelizeHookName = hookMapping[hookName] || hookName;
        
        // 检查是否是有效的Sequelize钩子
        if (validHooks.includes(sequelizeHookName)) {
          // 创建一个适配器函数，确保钩子函数接收正确的参数
          const hookAdapter = (hookName === 'validate' || hookName === 'save') 
            ? function(instance, options) {
                // 适配Mongoose风格的钩子到Sequelize风格
                return new Promise((resolve, reject) => {
                  const next = (err) => {
                    if (err) reject(err);
                    else resolve();
                  };
                  
                  // 调用原始钩子，但绑定实例作为this
                  try {
                    const result = options.hooks[hookName].call(instance, next);
                    if (result && typeof result.then === 'function') {
                      result.then(() => resolve()).catch(reject);
                    }
                  } catch (error) {
                    reject(error);
                  }
                });
              }
            : options.hooks[hookName];
          
          model.addHook(sequelizeHookName, hookAdapter);
        } else {
          console.warn(`警告: 钩子 "${hookName}" 不能映射到有效的Sequelize生命周期事件`);
        }
      });
    }
    
    // 注册自定义方法和静态方法
    if (options.classMethods) {
      Object.keys(options.classMethods).forEach(methodName => {
        model[methodName] = options.classMethods[methodName];
      });
    }
    
    // 添加实例方法
    if (options.instanceMethods) {
      Object.keys(options.instanceMethods).forEach(methodName => {
        model.prototype[methodName] = options.instanceMethods[methodName];
      });
    }
    
    return model;
  }
  
  /**
   * 创建文件系统存储模型
   * @param {String} modelName - 模型名称
   * @param {Object} fields - 字段定义
   * @param {Object} options - 其他选项
   * @returns {Object} 文件系统存储模型
   */
  static _createFileSystemModel(modelName, fields, options) {
    // 数据存储路径
    const collectionDir = path.join(DATA_DIR, options.collection || modelName.toLowerCase() + 's');
    
    // 确保目录存在
    fs.ensureDirSync(collectionDir);
    
    // 将通用字段定义转换为验证函数
    const validators = {};
    
    Object.keys(fields).forEach(fieldName => {
      validators[fieldName] = FieldTypeMapper.toFileSystem(fields[fieldName]);
    });
    
    // 创建文件系统模型
    return {
      name: modelName,
      
      /**
       * 创建记录
       * @param {Object} data - 要创建的数据
       * @returns {Promise<Object>} 创建的记录
       */
      async create(data) {
        // 生成 ID
        const id = data.id || uuidv4();
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        
        // 验证数据
        for (const [field, validator] of Object.entries(validators)) {
          const result = validator.validate(record[field]);
          if (!result.valid) {
            throw new Error(`字段 ${field} 验证失败: ${result.message}`);
          }
          if (result.value !== undefined) {
            record[field] = result.value;
          }
        }
        
        // 保存到文件
        const filePath = path.join(collectionDir, `${id}.json`);
        await fs.writeJson(filePath, record, { spaces: 2 });
        
        return record;
      },
      
      /**
       * 查找单个记录
       * @param {Object} query - 查询条件
       * @returns {Promise<Object>} 找到的记录
       */
      async findOne(query) {
        const records = await this.find(query);
        return records.length > 0 ? records[0] : null;
      },
      
      /**
       * 查找多个记录
       * @param {Object} query - 查询条件
       * @param {Object} options - 排序、分页等选项
       * @returns {Promise<Array>} 找到的记录数组
       */
      async find(query = {}, options = {}) {
        // 读取所有文件
        const files = await fs.readdir(collectionDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        let records = [];
        
        // 读取每个文件的内容
        for (const file of jsonFiles) {
          const filePath = path.join(collectionDir, file);
          const record = await fs.readJson(filePath);
          
          // 匹配查询条件
          let matches = true;
          for (const [key, value] of Object.entries(query)) {
            if (record[key] !== value) {
              matches = false;
              break;
            }
          }
          
          if (matches) {
            records.push(record);
          }
        }
        
        // 应用排序
        if (options.sort) {
          const sortFields = Object.entries(options.sort);
          records.sort((a, b) => {
            for (const [field, order] of sortFields) {
              if (a[field] < b[field]) return order === 1 ? -1 : 1;
              if (a[field] > b[field]) return order === 1 ? 1 : -1;
            }
            return 0;
          });
        }
        
        // 应用分页
        if (options.skip || options.limit) {
          const skip = options.skip || 0;
          const limit = options.limit || records.length;
          records = records.slice(skip, skip + limit);
        }
        
        return records;
      },
      
      /**
       * 更新记录
       * @param {Object} query - 查询条件
       * @param {Object} update - 更新内容
       * @param {Object} options - 更新选项
       * @returns {Promise<Object>} 更新结果
       */
      async update(query, update, options = {}) {
        const records = await this.find(query);
        let updatedCount = 0;
        
        for (const record of records) {
          // 更新记录
          const updatedRecord = { ...record, ...update, updatedAt: new Date() };
          
          // 验证更新后的数据
          for (const [field, validator] of Object.entries(validators)) {
            if (updatedRecord[field] !== undefined) {
              const result = validator.validate(updatedRecord[field]);
              if (!result.valid) {
                throw new Error(`字段 ${field} 验证失败: ${result.message}`);
              }
              if (result.value !== undefined) {
                updatedRecord[field] = result.value;
              }
            }
          }
          
          // 保存到文件
          const filePath = path.join(collectionDir, `${record.id}.json`);
          await fs.writeJson(filePath, updatedRecord, { spaces: 2 });
          
          updatedCount++;
          
          // 如果不是更新全部，仅更新第一个
          if (!options.multi && updatedCount > 0) {
            break;
          }
        }
        
        return { updated: updatedCount };
      },
      
      /**
       * 删除记录
       * @param {Object} query - 查询条件
       * @returns {Promise<Object>} 删除结果
       */
      async delete(query) {
        const records = await this.find(query);
        let deletedCount = 0;
        
        for (const record of records) {
          // 删除文件
          const filePath = path.join(collectionDir, `${record.id}.json`);
          await fs.remove(filePath);
          deletedCount++;
        }
        
        return { deleted: deletedCount };
      },
      
      /**
       * 统计记录数量
       * @param {Object} query - 查询条件
       * @returns {Promise<Number>} 记录数量
       */
      async count(query = {}) {
        const records = await this.find(query);
        return records.length;
      }
    };
  }
}

module.exports = {
  FieldTypeMapper,
  SchemaBuilder
}; 