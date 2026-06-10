# Life Assistant Platform

`life-service` 是一个前后端分离的校园生活服务示例项目，包含：

- `frontend/`：Vite 前端
- `backend/`：Spring Boot + MyBatis-Plus 后端
- `scripts/`：数据库初始化和一键启动脚本

这个版本已经补过一轮部署和业务链路修复，适合作为小组作业协作基线直接推到 GitHub。

## 1. 环境要求

请先保证本地已安装以下环境：

- Java 21
- Node.js 18+ 和 npm
- MySQL 8.0
- Windows PowerShell

如果你不是 Windows 环境，也可以手动执行 README 里的命令启动前后端。

## 2. 数据库准备

项目默认连接信息在 [application.yml](d:/coding/ideaprogram/life-service/backend/src/main/resources/application.yml:1)：

- Host: `127.0.0.1`
- Port: `3306`
- Database: `life_assistant`
- Username: `root`
- Password: `3.7182818280`

如果你的本地 MySQL 账号密码不同，有两种方式：

1. 修改 `backend/src/main/resources/application.yml`
2. 启动后端时传环境变量：

```powershell
$env:DB_URL="jdbc:mysql://127.0.0.1:3306/life_assistant?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&allowMultiQueries=true"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="你的密码"
```

初始化数据库：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\init-db.ps1
```

这个脚本会执行 [init.sql](d:/coding/ideaprogram/life-service/backend/src/main/resources/db/init.sql:1)，自动建库、建表并写入演示数据。

## 3. 后端运行

开发模式启动：

```powershell
cd backend
.\gradlew.bat bootRun
```

如果你想换端口，例如 `8081`：

```powershell
.\gradlew.bat bootRun --args="--server.port=8081"
```

打包运行：

```powershell
cd backend
.\gradlew.bat bootJar
java -jar build\libs\demo-0.0.1-SNAPSHOT.jar
```

默认后端地址：

- `http://127.0.0.1:8080`
- 健康检查：`http://127.0.0.1:8080/api/health`

## 4. 前端运行

开发模式：

```powershell
cd frontend
npm install
npm run dev
```

默认前端地址通常是：

- `http://127.0.0.1:5173`

生产预览：

```powershell
cd frontend
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

## 5. 一键启动

Windows 下可以直接执行：

```powershell
scripts\start.bat
```

这个脚本会尝试：

- 启动 MySQL 服务
- 初始化数据库
- 构建并启动后端
- 安装前端依赖并启动前端

如果你的 MySQL 服务名不是 `MySQL80`，请自行修改 [start.bat](d:/coding/ideaprogram/life-service/scripts/start.bat:1)。

## 6. 演示账号

初始化数据库后可直接使用这些账号：

- 普通用户：`demo / 123456`
- 商家：`merchant1 / 123456`
- 骑手：`rider01 / 123456`
- 管理员：`gl1 / gl1gl1gl1`

## 7. 已验证的主链路

当前版本已经实际验证通过以下流程：

- 用户登录
- 商家登录
- 骑手登录
- 管理员登录
- 浏览商家和商品
- 领取优惠券
- 下单
- 支付
- 骑手接单
- 用户确认收货
- 优惠券取消释放和完成核销

## 8. 建议的组内协作流程

建议组员拉取代码后按下面顺序跑：

1. `git clone`
2. 执行 `scripts\init-db.ps1`
3. 启动后端
4. 启动前端
5. 用上面的演示账号验证主链路

如果要提交自己的改动，建议先执行：

```powershell
cd backend
.\gradlew.bat test

cd ..\frontend
npm run build
```

## 9. 推送到 GitHub 前建议确认

- 不要提交 `node_modules/`、`build/`、`dist/`
- 不要提交本地运行日志，如 `*.out`、`*.err`
- 确认数据库账号密码不要换成你个人专用配置
- 如果改了接口或演示账号，记得同步更新 README

## 10. 常见问题

后端启动失败：

- 先确认 MySQL 已启动
- 再确认 `root / 3.7182818280` 可登录
- 最后检查 `DB_URL / DB_USERNAME / DB_PASSWORD`

前端接口请求失败：

- 确认后端已经启动
- 确认前端请求的端口和后端实际端口一致

数据库重置：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\init-db.ps1
```
