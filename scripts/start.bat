@echo off
chcp 65001 >nul
title 生活助手平台 - 启动中...

echo ========================================
echo     生活助手平台 - 一键启动
echo ========================================
echo.

:: ===== 1. 启动 MySQL =====
echo [1/3] 正在启动 MySQL...
net start MySQL80 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL 启动成功
) else (
    echo [OK] MySQL 已运行
)

:: ===== 2. 启动后端 =====
echo [2/3] 正在启动后端服务...
start "Backend" cmd /c "java -jar D:\coding\ideaprogram\stud\stud\backend\build\libs\demo-0.0.1-SNAPSHOT.jar"

:: 等待后端启动（最多等30秒）
echo 等待后端启动...
set WAIT_COUNT=0
:WAIT_BACKEND
timeout /t 2 /nobreak >nul
set /a WAIT_COUNT+=1
curl -s http://localhost:8080/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 后端启动成功 ^(端口 8080^)
    goto BACKEND_READY
)
if %WAIT_COUNT% lss 15 goto WAIT_BACKEND
echo [WARN] 后端启动超时，请检查日志
:BACKEND_READY

:: ===== 3. 启动前端 =====
echo [3/3] 正在启动前端服务...
start "Frontend" cmd /c "cd /d D:\coding\ideaprogram\stud\stud\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo     启动完成！
echo.
echo     前端地址: http://localhost:5173
echo     后端地址: http://localhost:8080
echo.
echo     测试账号:
echo     消费者: consumer1 / user123
echo     商家:   merchant01 / merchant123
echo ========================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5173
