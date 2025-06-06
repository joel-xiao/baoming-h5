const Registration = require('../models/Registration');
const crypto = require('crypto');
const { getWechatPay, getJsapiPayParams } = require('../config/wechatpay');

// 生成随机订单号
const generateOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ORDER${year}${month}${day}${random}`;
};

// 创建支付订单
exports.createPayment = async (req, res) => {
  try {
    const { openid, name, phone, isTeamLeader, amount = 99 } = req.body;

    if (!openid || !name || !phone) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 创建订单号
    const orderNo = generateOrderNo();
    console.log(`创建支付订单: ${orderNo}, 用户: ${name}, 金额: ${amount}元`);

    // 检查是否已存在相同openid的已支付订单
    const existingOrder = await Registration.findOne({ 
      openid, 
      paymentStatus: 'success' 
    });

    if (existingOrder) {
      console.log(`用户 ${name} 已有已支付订单: ${existingOrder.orderNo}`);
      return res.status(200).json({
        success: true,
        data: {
          existingOrder: true,
          orderNo: existingOrder.orderNo,
          orderId: existingOrder._id,
          paymentStatus: 'success',
          message: '你已经成功支付过报名费，无需重复支付'
        }
      });
    }

    // 创建报名记录
    const registration = new Registration({
      name,
      phone,
      openid,
      isTeamLeader: isTeamLeader || false,
      orderNo,
      paymentAmount: amount
    });

    await registration.save();
    console.log(`订单保存成功: ${orderNo}`);

    // 获取微信支付实例
    const wxpay = getWechatPay();
    
    // 如果微信支付初始化失败，使用模拟数据
    if (!wxpay) {
      console.log('使用模拟微信支付数据');
      return res.status(200).json({
        success: true,
        data: {
          paymentParams: {
            appId: 'wx123456789',
            timeStamp: Math.floor(Date.now() / 1000).toString(),
            nonceStr: Math.random().toString(36).substr(2, 15),
            package: 'prepay_id=wx123456789',
            signType: 'RSA',
            paySign: 'mockSignature',
          },
          orderId: registration._id,
          orderNo
        }
      });
    }

    // 创建微信支付订单
    const params = {
      description: '武道开学报名费用',
      out_trade_no: orderNo,
      notify_url: process.env.WECHAT_PAY_NOTIFY_URL,
      amount: {
        total: amount * 100, // 单位为分，99元 = 9900分
        currency: 'CNY'
      },
      payer: {
        openid
      }
    };

    try {
      // 调用微信支付接口创建订单
      console.log('调用微信支付下单接口', params);
      const result = await wxpay.transactions_jsapi(params);
      console.log('微信支付下单结果:', result);
      
      if (result && result.prepay_id) {
        // 生成前端所需的JSAPI支付参数
        const paymentParams = getJsapiPayParams(result.prepay_id);
        
        // 更新订单信息
        await Registration.findByIdAndUpdate(registration._id, {
          $set: {
            prepayId: result.prepay_id,
            updatedAt: new Date()
          }
        });
        
        return res.status(200).json({
          success: true,
          data: {
            paymentParams,
            orderId: registration._id,
            orderNo
          }
        });
      } else {
        console.error('创建微信支付订单失败，返回结果:', result);
        return res.status(500).json({ success: false, message: '创建支付订单失败' });
      }
    } catch (wxError) {
      console.error('微信支付API调用错误:', wxError);
      
      // 记录错误但仍返回成功以便前端处理
      return res.status(200).json({
        success: true,
        data: {
          paymentParams: null,
          errorMessage: wxError.message || '微信支付API调用失败',
          orderId: registration._id,
          orderNo
        }
      });
    }
  } catch (error) {
    console.error('创建支付订单错误:', error);
    return res.status(500).json({ success: false, message: '创建支付订单失败' });
  }
};

// 支付回调处理
exports.paymentNotify = async (req, res) => {
  try {
    console.log('收到微信支付回调请求');
    
    // 获取微信支付实例
    const wxpay = getWechatPay();
    
    // 如果微信支付初始化失败，使用模拟数据
    if (!wxpay) {
      console.log('使用模拟微信支付回调处理');
      
      // 模拟获取订单号
      const orderNo = req.body.out_trade_no || req.query.out_trade_no;
      
      if (orderNo) {
        // 更新订单状态
        const updatedOrder = await Registration.findOneAndUpdate(
          { orderNo },
          { 
            paymentStatus: 'success',
            paymentTime: new Date(),
            updatedAt: new Date()
          },
          { new: true }
        );
        
        if (updatedOrder) {
          console.log(`模拟支付回调: 订单 ${orderNo} 支付成功`);
        } else {
          console.log(`模拟支付回调: 未找到订单 ${orderNo}`);
        }
      }
      
      return res.status(200).json({
        code: 'SUCCESS',
        message: '成功'
      });
    }

    // 验证签名
    const signature = req.headers['wechatpay-signature'];
    const timestamp = req.headers['wechatpay-timestamp'];
    const nonce = req.headers['wechatpay-nonce'];
    const body = req.body;

    // 打印回调信息
    console.log('微信支付回调信息:', {
      headers: req.headers,
      body: req.body
    });

    // 验证签名
    const verified = wxpay.verifySign(timestamp, nonce, body, signature);
    
    if (!verified) {
      console.error('微信支付回调签名验证失败');
      return res.status(401).json({ code: 'FAIL', message: '签名验证失败' });
    }

    // 解密回调数据
    try {
      const resource = body.resource;
      const decryptedData = wxpay.decryptResource(resource);
      console.log('解密后的支付回调数据:', decryptedData);
      
      if (decryptedData.trade_state === 'SUCCESS') {
        // 支付成功，更新数据库
        const orderNo = decryptedData.out_trade_no;
        const transactionId = decryptedData.transaction_id;
        
        const updated = await Registration.findOneAndUpdate(
          { orderNo },
          { 
            paymentStatus: 'success',
            transactionId: transactionId,
            paymentTime: new Date(),
            updatedAt: new Date()
          },
          { new: true }
        );
        
        if (updated) {
          console.log(`支付成功，订单已更新: ${orderNo}, 交易ID: ${transactionId}`);
        } else {
          console.error(`支付成功但未找到对应订单: ${orderNo}`);
        }
      } else {
        console.log(`支付未成功，状态为: ${decryptedData.trade_state}`);
      }
    } catch (decryptError) {
      console.error('解密回调数据失败:', decryptError);
      return res.status(500).json({ code: 'FAIL', message: '解密回调数据失败' });
    }

    // 返回处理成功信息给微信
    return res.status(200).json({
      code: 'SUCCESS',
      message: '成功'
    });
  } catch (error) {
    console.error('支付回调处理错误:', error);
    return res.status(500).json({ code: 'FAIL', message: '处理失败' });
  }
};

// 查询支付状态
exports.queryPaymentStatus = async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    if (!orderNo) {
      return res.status(400).json({ success: false, message: '缺少订单号' });
    }
    
    const registration = await Registration.findOne({ orderNo });
    
    if (!registration) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        orderNo,
        paymentStatus: registration.paymentStatus,
        paymentTime: registration.paymentTime
      }
    });
  } catch (error) {
    console.error('查询支付状态错误:', error);
    return res.status(500).json({ success: false, message: '查询支付状态失败' });
  }
};

// 获取所有支付订单（管理员接口）
exports.getAllPayments = async (req, res) => {
  try {
    console.log('开始获取支付订单列表，查询参数:', req.query);
    
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    console.log(`分页参数: page=${page}, limit=${limit}, skip=${skip}`);
    
    // 筛选条件
    const filter = {};
    if (req.query.status) {
      filter.paymentStatus = req.query.status;
      console.log(`应用状态筛选: ${req.query.status}`);
    }
    
    try {
      // 使用最基础的文件系统模式处理，完全跳过Mongoose的复杂API
      console.log('尝试使用文件存储模式获取订单数据');
      
      // 获取所有订单数据
      let allOrders = [];
      try {
        // 正常方式获取订单
        allOrders = await Registration.find(filter);
        console.log(`初始查询获取到${allOrders.length}条数据`);
      } catch (findError) {
        console.error('使用find方法查询失败，尝试直接读取文件:', findError);
        
        // 直接从文件读取作为备份解决方案
        try {
          const fs = require('fs');
          const path = require('path');
          const registrationsFile = path.join(__dirname, '../data/registrations.json');
          
          if (fs.existsSync(registrationsFile)) {
            const rawData = fs.readFileSync(registrationsFile, 'utf8');
            allOrders = JSON.parse(rawData);
            console.log(`从文件直接读取到${allOrders.length}条数据`);
            
            // 如果有状态筛选，在内存中进行过滤
            if (filter.paymentStatus) {
              allOrders = allOrders.filter(order => order.paymentStatus === filter.paymentStatus);
              console.log(`筛选后还有${allOrders.length}条数据`);
            }
          } else {
            console.log('数据文件不存在，返回空数组');
            allOrders = [];
          }
        } catch (fsError) {
          console.error('直接从文件读取失败:', fsError);
          allOrders = [];
        }
      }
      
      // 计算总数
      const total = allOrders.length;
      console.log(`总记录数: ${total}`);
      
      // 在内存中进行排序和分页
      // 确保createdAt是Date对象或可解析的日期字符串
      let sortedOrders = [...allOrders].sort((a, b) => {
        // 安全地解析日期
        let dateA, dateB;
        try {
          dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          
          // 检查是否有效日期
          if (isNaN(dateA.getTime())) dateA = new Date(0);
          if (isNaN(dateB.getTime())) dateB = new Date(0);
        } catch (e) {
          console.warn('日期解析错误:', e);
          dateA = new Date(0);
          dateB = new Date(0);
        }
        
        // 降序排列
        return dateB.getTime() - dateA.getTime();
      });
      
      // 安全地应用分页
      const startIndex = Math.min(Math.max(0, skip), total);
      const endIndex = Math.min(startIndex + limit, total);
      let pagedOrders = sortedOrders.slice(startIndex, endIndex);
      
      console.log(`分页后返回${pagedOrders.length}条记录 (从${startIndex}到${endIndex})`);
      
      // 计算总页数
      const pages = Math.max(1, Math.ceil(total / limit));
      
      return res.status(200).json({
        success: true,
        data: {
          orders: pagedOrders,
          pagination: {
            total,
            page,
            limit,
            pages
          }
        }
      });
    } catch (error) {
      console.error('获取支付订单错误:', error);
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      return res.status(500).json({ 
        success: false, 
        message: '获取支付订单失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (outerError) {
    console.error('最外层错误捕获:', outerError);
    return res.status(500).json({ 
      success: false, 
      message: '服务器内部错误'
    });
  }
}; 