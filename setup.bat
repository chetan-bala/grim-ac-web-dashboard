@echo off
title Grim AC Dashboard - Setup Wizard
cls
echo ===============================================
echo        GRIM AC DASHBOARD - SETUP WIZARD
echo ===============================================
echo.
echo This will configure your dashboard automatically.
echo.

set /p supabase_key="Paste your SUPABASE SERVICE_ROLE key (eyJ...): "
set /p gmail_user="Enter your Gmail address: "
set /p gmail_pass="Enter your Gmail App Password: "

echo.
echo Updating backend\.env...
(
echo SUPABASE_URL=https://igrsapeyxgmkjhadfrir.supabase.co
echo SUPABASE_SERVICE_KEY=%supabase_key%
echo JWT_SECRET=grim-ac-local-secret-2026
echo EMAIL_USER=%gmail_user%
echo EMAIL_PASS=%gmail_pass%
echo FRONTEND_URL=http://localhost:3000
echo PORT=3000
) > "C:\GrimWebDashboard\backend\.env"

echo.
echo Configuring auto-start...
set startup_folder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy "C:\GrimWebDashboard\GrimDashboard-AutoStart.bat" "%startup_folder%\" >nul 2>&1

echo.
echo ===============================================
echo SETUP COMPLETE!
echo ===============================================
echo.
echo Next steps:
echo 1. Run "GrimDashboard-Control.bat" to start/stop
echo 2. Or restart your PC - it will ask to start automatically
echo 3. Open http://localhost:3000 in your browser
echo.
pause
