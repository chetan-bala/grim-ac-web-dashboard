@echo off
title Grim AC Web Dashboard
echo Starting backend and frontend...
echo.

start "Backend" cmd /k "cd /d C:\GrimWebDashboard\backend && npm install && node server.js"
timeout /t 3 /nobreak > nul
start "Frontend" cmd /k "cd /d C:\GrimWebDashboard\frontend && npm install && npm start"

echo.
echo ==============================================
echo  DASHBOARD RUNNING!
echo ==============================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser
echo.
echo Press ANY key to STOP everything...
pause > nul

echo.
echo Stopping...
taskkill /f /im node.exe >nul 2>&1
echo Dashboard stopped.
pause
