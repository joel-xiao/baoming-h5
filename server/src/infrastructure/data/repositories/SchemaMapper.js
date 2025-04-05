const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { dbType, sequelize, DATA_DIR } = require('../connectors/DatabaseConnector');

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
    
    // 根据当前数据库类型创建模型
    switch (dbType) {
      case 'mongodb':
        return this._createMongooseModel(modelName, fields, options);
      case 'mysql':
        return this._createSequelizeModel(modelName, fields, options);
      case 'filesystem':
        return this._createFileSystemModel(modelName, fields, options);
      default:
        throw new Error(`不支持的数据库类型: ${dbType}`);
    }
  }

  /**
   * 创建 MongoDB/Mongoose 模型
   * @param {String} modelName - 模型名称
   * @param {Object} fields - 字段定义
   * @param {Object} options - 其他选项(方法、索引等)
   * @returns {mongoose.Model} Mongoose模型
   */
  static _createMongooseModel(modelName, fields, options = {}) {
    // 将字段定义转换为Mongoose Schema格式
    const schemaFields = {};
    for (const [key, fieldDef] of Object.entries(fields)) {
      schemaFields[key] = FieldTypeMapper.toMongoose(fieldDef);
    }
    
    // 创建Mongoose Schema
    const schema = new mongoose.Schema(schemaFields, {
      collection: options.collection || modelName.toLowerCase() + 's',
      timestamps: true
    });
    
    // 添加实例方法
    if (options.methods) {
      for (const [name, method] of Object.entries(options.methods)) {
        schema.methods[name] = method;
      }
    }
    
    // 添加静态方法
    if (options.statics) {
      for (const [name, method] of Object.entries(options.statics)) {
        schema.statics[name] = method;
      }
    }
    
    // 添加虚拟属性
    if (options.virtuals) {
      for (const [name, virtual] of Object.entries(options.virtuals)) {
        schema.virtual(name).get(virtual.get).set(virtual.set);
      }
    }
    
    // 添加索引
    if (options.indexes) {
      for (const index of options.indexes) {
        schema.index(index.fields, index.options);
      }
    }
    
    // 添加钩子
    if (options.hooks) {
      for (const [hookName, hook] of Object.entries(options.hooks)) {
        schema.pre(hookName, hook);
      }
    }
    
    // 注册模型
    try {
      // 如果模型已存在，返回已存在的模型
      return mongoose.models[modelName] || mongoose.model(modelName, schema);
    } catch (error) {
      // 如果出错，尝试重新注册模型
      return mongoose.model(modelName, schema);
    }
  }

  /**
   * 创建 MySQL/Sequelize 模型
   * @param {String} modelName - 模型名称
   * @param {Object} fields - 字段定义
   * @param {Object} options - 其他选项(方法、索引等)
   * @returns {Sequelize.Model} Sequelize模型
   */
  static _createSequelizeModel(modelName, fields, options = {}) {
    // 将字段定义转换为Sequelize格式
    const schemaFields = {};
    for (const [key, fieldDef] of Object.entries(fields)) {
      schemaFields[key] = FieldTypeMapper.toSequelize(fieldDef);
    }
    
    // 创建Sequelize模型
    const model = sequelize.define(modelName, schemaFields, {
      tableName: options.collection || modelName.toLowerCase() + 's',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      hooks: options.hooks || {}
    });
    
    // 添加实例方法
    if (options.methods) {
      for (const [name, method] of Object.entries(options.methods)) {
        model.prototype[name] = method;
      }
    }
    
    // 添加静态方法
    if (options.statics) {
      for (const [name, method] of Object.entries(options.statics)) {
        model[name] = method;
      }
    }
    
    // 添加索引
    if (options.indexes) {
      for (const index of options.indexes) {
        model.addIndex(index.fields, index.options);
      }
    }
    
    return model;
  }
  
  /**
   * 创建文件系统模型
   * @param {String} modelName - 模型名称
   * @param {Object} fields - 字段定义
   * @param {Object} options - 其他选项(方法、索引等)
   * @returns {Object} 文件系统模型
   */
  static _createFileSystemModel(modelName, fields, options = {}) {
    const collectionName = options.collection || modelName.toLowerCase() + 's';
    const collectionPath = path.join(DATA_DIR, collectionName);
    
    // 确保集合目录存在
    fs.ensureDirSync(collectionPath);
    
    // 构建文件系统模型
    const fileSystemModel = {
      // 创建记录
      async create(data) {
        const id = data.id || uuidv4();
        const filePath = path.join(collectionPath, `${id}.json`);
        await fs.writeJSON(filePath, { ...data, id, createdAt: new Date(), updatedAt: new Date() });
        return { ...data, id };
      },
      
      // 根据ID查找记录
      async findById(id) {
        const filePath = path.join(collectionPath, `${id}.json`);
        return fs.existsSync(filePath) ? fs.readJSON(filePath) : null;
      },
      
      // 查找匹配条件的记录
      async find(query = {}) {
        const files = await fs.readdir(collectionPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const results = [];
        for (const file of jsonFiles) {
          const filePath = path.join(collectionPath, file);
          const data = await fs.readJSON(filePath);
          
          // 检查数据是否匹配查询条件
          let matches = true;
          for (const [key, value] of Object.entries(query)) {
            if (data[key] !== value) {
              matches = false;
              break;
            }
          }
          
          if (matches) {
            results.push(data);
          }
        }
        
        return results;
      },
      
      // 根据ID更新记录
      async findByIdAndUpdate(id, updateData) {
        const filePath = path.join(collectionPath, `${id}.json`);
        if (!fs.existsSync(filePath)) {
          return null;
        }
        
        const data = await fs.readJSON(filePath);
        const updatedData = { ...data, ...updateData, updatedAt: new Date() };
        await fs.writeJSON(filePath, updatedData);
        return updatedData;
      },
      
      // 根据ID删除记录
      async findByIdAndDelete(id) {
        const filePath = path.join(collectionPath, `${id}.json`);
        if (!fs.existsSync(filePath)) {
          return null;
        }
        
        const data = await fs.readJSON(filePath);
        await fs.remove(filePath);
        return data;
      }
    };
    
    // 添加实例方法
    if (options.methods) {
      for (const [name, method] of Object.entries(options.methods)) {
        fileSystemModel[name] = method;
      }
    }
    
    // 添加静态方法
    if (options.statics) {
      for (const [name, method] of Object.entries(options.statics)) {
        fileSystemModel[name] = method;
      }
    }
    
    return fileSystemModel;
  }
}

// 导出SchemaBuilder和FieldTypeMapper
module.exports = {
  SchemaBuilder,
  FieldTypeMapper
}; 