# Life Assistant Platform

本仓库为前后端分离的校园生活服务示例项目。仓库结构已整理为更清晰的布局，下面是当前主要目录说明及启动方式。

主要目录

- `frontend/`：Vite 前端（由原 bighomework 提取）
- `backend/`：Spring Boot 后端（由原 houduan/demo 提取）
- `scripts/start.bat`：Windows 一键启动脚本（启动 MySQL、后端 JAR、前端 dev）
- `backup_*.zip`：已生成的原始目录备份（位于项目根，请妥善保存）

快速启动（Windows，推荐）

双击或在 PowerShell / CMD 中运行：

```powershell
scripts\start.bat
```

脚本会尝试：启动 MySQL 服务（MySQL80）、启动后端 JAR（`backend/build/libs`）并在 `frontend` 目录运行 `npm run dev`。

成功启动后常用地址：

- 前端: `http://localhost:5173`
- 后端: `http://localhost:8080`
- 后端健康检查: `http://localhost:8080/api/health`

手动启动（可选）

后端：

```powershell
cd backend
.\gradlew.bat build    # 若测试导致构建失败，可加 -x test
java -jar build\libs\demo-0.0.1-SNAPSHOT.jar
```

前端：

```powershell
cd frontend
npm install
npm run dev
```

环境要求

- Java 21（项目使用 toolchain 指定）
- Node.js + npm
- MySQL（请在 `backend/src/main/resources/application.yml` 中配置数据库连接）

备注

- 我已把原始混乱目录备份为 `backup_*.zip`，若需还原请告知。  
- 如果本地 MySQL 服务名或端口不同，请编辑 `scripts/start.bat` 以匹配你的环境。

如需我继续清理或把 README 扩展为详细的开发者指南，请告诉我下一步要做什么。
