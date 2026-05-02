@echo off
title Grim AC Web Dashboard Control
:menu
cls
echo ================================================
echo        GRIM AC WEB DASHBOARD CONTROL
echo ================================================
echo.
echo  [1] Start Dashboard (Backend + Frontend)
echo  [2] Stop Dashboard
echo  [3] Check Status
echo  [4] Start on Windows Startup (Enable)
echo  [5] Remove from Windows Startup (Disable)
echo  [6] Exit
echo.
set /p choice="Choose an option (1-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto status
if "%choice%"=="4" goto enable_startup
if "%choice%"=="5" goto disable_startup
if "%choice%"=="6" exit

:start
echo.
echo Starting Grim AC Web Dashboard...
echo.
start "Grim Backend" cmd /k "cd /d C:\GrimWebDashboard\backend && npm install && node server.js"
timeout /t 3 /nobreak > nul
start "Grim Frontend" cmd /k "cd /d C:\GrimWebDashboard\frontend && npm install && npm start"
echo.
echo Dashboard starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3000
echo.
pause
goto menu

:stop
echo.
echo Stopping Grim AC Web Dashboard...
taskkill /f /im node.exe >nul 2>&1
echo Done!
pause
goto menu

:status
echo.
tasklist | findstr /i "node.exe" >nul 2>&1
if %errorlevel%==0 (
  echo STATUS: RUNNING
  echo Node processes found:
  tasklist | findstr /i "node.exe"
) else (
  echo STATUS: STOPPED
)
pause
goto menu

:enable_startup
echo.
set startup_folder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy "C:\GrimWebDashboard\GrimDashboard-AutoStart.bat" "%startup_folder%\" >nul 2>&1
if exist "%startup_folder%\GrimDashboard-AutoStart.bat" (
  echo Startup enabled! Dashboard will start when you log in.
) else (
  echo Failed to enable startup.
)
pause
goto menu

:disable_startup
echo.
set startup_folder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
del "%startup_folder%\GrimDashboard-AutoStart.bat" >nul 2>&1
echo Startup disabled!
pause
goto menu
