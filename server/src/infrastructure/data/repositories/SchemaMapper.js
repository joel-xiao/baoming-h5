const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

/**
 * 字段类型映射器 - 将通用字段类型映射到不同数据库类型
 */
class FieldTypeMapper {
  /**
   * 映射到 MongoDB/Mongoose 类型
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
    
    Object.keys(mongooseField).forEach(key => {
      if (mongooseField[key] === undefined) {
        delete mongooseField[key];
      }
    });
    
    return mongooseField;
  }
  
  /**
   * 映射到 MySQL/Sequelize 类型
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
    
    Object.keys(sequelizeField).forEach(key => {
      if (sequelizeField[key] === undefined) {
        delete sequelizeField[key];
      }
    });
    
    return sequelizeField;
  }
  
  /**
   * 映射到文件系统存储验证函数
   */
  static toFileSystem(fieldDefinition) {
    const { type, required, default: defaultValue, ...rest } = fieldDefinition;
    
    return {
      validate: value => {
        if (required && (value === undefined || value === null)) {
          return { valid: false, message: '字段为必填项' };
        }
        
        if ((value === undefined || value === null) && defaultValue !== undefined) {
          return { valid: true, value: defaultValue };
        }
        
        switch (type) {
          case 'string':
            if (value !== undefined && typeof value !== 'string') {
              return { valid: false, message: '字段必须是字符串类型' };
            }
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
        
        return { valid: true, value };
      },
      defaultValue
    };
  }
}

/**
 * Schema 构建器 - 从统一字段定义构建不同数据库模型
 */
class SchemaMapper {
  /**
   * @param {Object} database - 数据库连接器实例
   * @param {Object} logger - 日志服务实例
   */
  constructor(database, logger) {
    this.database = database;
    this.logger = logger;
    this.dbType = database.getType();
    this.sequelize = database.getSequelize();
    this.DATA_DIR = database.getDataDir();
  }

  /**
   * 创建模型
   */
  createModel(modelName, fields, options = {}) {
    const { methods = {}, statics = {} } = options;
    
    switch (this.dbType) {
      case 'mongodb':
        return this._createMongooseModel(modelName, fields, options);
      case 'mysql':
        return this._createSequelizeModel(modelName, fields, options);
      case 'filesystem':
        return this._createFileSystemModel(modelName, fields, options);
      default:
        throw new Error(`不支持的数据库类型: ${this.dbType}`);
    }
  }

  /**
   * 创建 MongoDB/Mongoose 模型
   */
  _createMongooseModel(modelName, fields, options = {}) {
    const schemaFields = {};
    for (const [key, fieldDef] of Object.entries(fields)) {
      schemaFields[key] = FieldTypeMapper.toMongoose(fieldDef);
    }
    
    const schema = new mongoose.Schema(schemaFields, {
      collection: options.collection || modelName.toLowerCase() + 's',
      timestamps: true
    });
    
    if (options.methods) {
      for (const [name, method] of Object.entries(options.methods)) {
        schema.methods[name] = method;
      }
    }
    
    if (options.statics) {
      for (const [name, method] of Object.entries(options.statics)) {
        schema.statics[name] = method;
      }
    }
    
    if (options.virtuals) {
      for (const [name, virtual] of Object.entries(options.virtuals)) {
        schema.virtual(name).get(virtual.get).set(virtual.set);
      }
    }
    
    if (options.indexes) {
      for (const index of options.indexes) {
        schema.index(index.fields, index.options);
      }
    }
    
    if (options.hooks) {
      for (const [hookName, hook] of Object.entries(options.hooks)) {
        schema.pre(hookName, hook);
      }
    }
    
    try {
      return mongoose.models[modelName] || mongoose.model(modelName, schema);
    } catch (error) {
      return mongoose.model(modelName, schema);
    }
  }

  /**
   * 创建 MySQL/Sequelize 模型
   */
  _createSequelizeModel(modelName, fields, options = {}) {
    const schemaFields = {};
    for (const [key, fieldDef] of Object.entries(fields)) {
      schemaFields[key] = FieldTypeMapper.toSequelize(fieldDef);
    }
    
    const model = this.sequelize.define(modelName, schemaFields, {
      tableName: options.collection || modelName.toLowerCase() + 's',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      hooks: options.hooks || {}
    });
    
    if (options.methods) {
      for (const [name, method] of Object.entries(options.methods)) {
        model.prototype[name] = method;
      }
    }
    
    if (options.statics) {
      for (const [name, method] of Object.entries(options.statics)) {
        model[name] = method;
      }
    }
    
    if (options.indexes) {
      for (const index of options.indexes) {
        model.addIndex(index.fields, index.options);
      }
    }
    
    return model;
  }
  
  /**
   * 创建文件系统模型
   */
  _createFileSystemModel(modelName, fields, options = {}) {
    const collectionName = options.collection || modelName.toLowerCase() + 's';
    const collectionPath = path.join(this.DATA_DIR, collectionName);
    
    fs.ensureDirSync(collectionPath);
    
    const fileSystemModel = {
      async create(data) {
        const id = data.id || uuidv4();
        const filePath = path.join(collectionPath, `${id}.json`);
        await fs.writeJSON(filePath, { ...data, id, createdAt: new Date(), updatedAt: new Date() });
        return { ...data, id };
      },
      
      async findById(id) {
        const filePath = path.join(collectionPath, `${id}.json`);
        return fs.existsSync(filePath) ? fs.readJSON(filePath) : null;
      },
      
      async find(query = {}) {
        const files = await fs.readdir(collectionPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const results = [];
        for (const file of jsonFiles) {
          const filePath = path.join(collectionPath, file);
          const data = await fs.readJSON(filePath);
          
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
    
    if (options.methods) {
      for (const [name, method] of Object.entries(options.methods)) {
        fileSystemModel[name] = method;
      }
    }
    
    if (options.statics) {
      for (const [name, method] of Object.entries(options.statics)) {
        fileSystemModel[name] = method;
      }
    }
    
    return fileSystemModel;
  }
}

module.exports = SchemaMapper; 