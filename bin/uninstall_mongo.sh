#!/bin/bash

# 检查是否为root用户或使用sudo执行
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo权限运行此脚本。"
    exit 1
fi

# 步骤1: 停止MongoDB服务
echo "正在停止MongoDB服务..."
systemctl stop mongod
if [ $? -ne 0 ]; then
    echo "停止MongoDB服务失败，可能服务未运行。"
fi

# 步骤2: 禁用MongoDB服务开机自启
echo "正在禁用MongoDB服务开机自启..."
systemctl disable mongod
if [ $? -ne 0 ]; then
    echo "禁用MongoDB服务开机自启失败。"
fi

# 步骤3: 移除MongoDB软件包
echo "正在移除MongoDB软件包..."
apt remove --purge -y mongodb-org mongodb-org-server mongodb-org-shell mongodb-org-mongos mongodb-org-tools
if [ $? -ne 0 ]; then
    echo "移除MongoDB软件包失败，请手动检查问题。"
    exit 1
fi

# 步骤4: 清理软件包缓存
echo "正在清理软件包缓存..."
apt autoremove -y
apt clean
if [ $? -ne 0 ]; then
    echo "清理软件包缓存失败。"
fi

# 步骤5: 删除MongoDB数据和配置目录
echo "正在删除MongoDB数据和配置目录..."
rm -rf /var/lib/mongodb
rm -rf /var/log/mongodb
rm -rf /etc/mongod.conf
rm -rf /etc/apt/sources.list.d/mongodb-org-6.0.list
rm -rf /etc/apt/trusted.gpg.d/mongodb-server-6.0.asc

echo "MongoDB卸载完成！"