#!/bin/bash

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    echo "请以 root 权限运行此脚本。"
    exit 1
fi

# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -

# 添加 MongoDB 源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# 更新包列表
apt-get update

# 安装 MongoDB
apt-get install -y mongodb-org

# 创建数据目录
mkdir -p ~/mongodb-data

# 修改 MongoDB 配置
cat > /etc/mongod.conf << EOF
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
storage:
  dbPath: $HOME/mongodb-data
  journal:
    enabled: true
net:
  port: 27017
  bindIp: 127.0.0.1
EOF

# 创建日志目录
mkdir -p /var/log/mongodb
touch /var/log/mongodb/mongod.log
chmod 777 /var/log/mongodb/mongod.log

# 创建 MongoDB 服务脚本
cat > /etc/init.d/mongod << EOF
#!/bin/sh
### BEGIN INIT INFO
# Provides:          mongod
# Required-Start:    $network $local_fs $remote_fs
# Required-Stop:     $network $local_fs $remote_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: MongoDB database server
# Description:       MongoDB database server
### END INIT INFO

PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
DAEMON=/usr/bin/mongod
DAEMON_ARGS="--config /etc/mongod.conf"
NAME=mongod
DESC="MongoDB database server"
PIDFILE=/var/run/\$NAME.pid

test -x \$DAEMON || exit 0

set -e

. /lib/lsb/init-functions

case "\$1" in
  start)
    log_daemon_msg "Starting \$DESC" "\$NAME"
    start-stop-daemon --start --background --pidfile \$PIDFILE --make-pidfile --exec \$DAEMON -- \$DAEMON_ARGS
    log_end_msg \$?
    ;;
  stop)
    log_daemon_msg "Stopping \$DESC" "\$NAME"
    start-stop-daemon --stop --pidfile \$PIDFILE
    log_end_msg \$?
    rm -f \$PIDFILE
    ;;
  restart|force-reload)
    log_daemon_msg "Restarting \$DESC" "\$NAME"
    start-stop-daemon --stop --pidfile \$PIDFILE
    sleep 1
    start-stop-daemon --start --background --pidfile \$PIDFILE --make-pidfile --exec \$DAEMON -- \$DAEMON_ARGS
    log_end_msg \$?
    ;;
  status)
    status_of_proc -p \$PIDFILE "\$DAEMON" "\$NAME" && exit 0 || exit \$?
    ;;
  *)
    N=/etc/init.d/\$NAME
    echo "Usage: \$N {start|stop|restart|force-reload|status}" >&2
    exit 1
    ;;
esac

exit 0
EOF

# 赋予服务脚本执行权限
chmod +x /etc/init.d/mongod

# 注册服务
update-rc.d mongod defaults

# 启动 MongoDB 服务
service mongod start

# 检查服务状态
service mongod status
    