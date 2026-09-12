@echo off
title AepttasShield Full Stack Launcher
echo ========================================================
echo Starting All Backend Servers and React Native UI...
echo ========================================================

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [1/3] Starting Malware APK Scanner Backend (Port 8001)...
start "Malware Backend" /d "%ROOT_DIR%backend\malware" cmd /k "node server_mal.js"

echo [2/3] Starting Vulnerability Backend (Port 8000)...
start "Vulnerability Backend" /d "%ROOT_DIR%backend\vulnerability" cmd /k "python run_server.py"

echo [3/3] Starting PostgreSQL Auth Backend (Port 8002)...
start "Auth Backend" /d "%ROOT_DIR%backend-reference" cmd /k "python run_postgres_auth_server.py"

echo.
echo ========================================================
echo Launching Android App / Emulator...
echo ========================================================
echo.

call npx react-native run-android

pause
