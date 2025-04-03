// 测试API脚本，使用fetch直接调用API

async function testAPI() {
  // 设置基础URL
  const baseUrl = 'http://127.0.0.1:3001';
  
  console.log('开始测试API...');
  console.log(`使用基础URL: ${baseUrl}`);

  // 测试GET请求
  try {
    console.log('测试GET请求: /api/test');
    const response = await fetch(`${baseUrl}/api/test`);
    const data = await response.json();
    console.log('GET请求响应:', data);
  } catch (error) {
    console.error('GET请求失败:', error);
  }

  // 测试POST请求
  try {
    console.log('测试POST请求: /api/test');
    const response = await fetch(`${baseUrl}/api/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '测试用户',
        message: '这是一个测试'
      }),
    });
    const data = await response.json();
    console.log('POST请求响应:', data);
  } catch (error) {
    console.error('POST请求失败:', error);
  }

  // 测试创建队长报名
  try {
    console.log('测试POST请求: /api/registration/leader');
    const response = await fetch(`${baseUrl}/api/registration/leader`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '测试队长',
        phone: '13800138000',
        openid: 'test_openid_' + Date.now()
      }),
    });
    const data = await response.json();
    console.log('创建队长响应:', data);
  } catch (error) {
    console.error('创建队长请求失败:', error);
  }
}

testAPI(); 