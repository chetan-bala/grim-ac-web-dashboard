@echo off
title Grim AC Dashboard - Startup Prompt
echo.
echo ===============================================
echo    GRIM AC WEB DASHBOARD
echo ===============================================
echo.
set /p choice="Start dashboard now? (Y/N): "
if /i "%choice%"=="Y" (
  cd /d C:\GrimWebDashboard\backend
  start /min cmd /k "npm install && node server.js"
  timeout /t 3 /nobreak > nul
  cd /d C:\GrimWebDashboard\frontend
  start /min cmd /k "npm install && npm start"
  echo Dashboard starting... Open http://localhost:3000
) else (
  echo Dashboard not started.
)
timeout /t 3 /nobreak > nul
