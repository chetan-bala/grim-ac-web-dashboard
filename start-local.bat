@echo off
echo Starting Grim AC Web Dashboard locally...
echo.

echo Starting Backend on port 3000...
start "Backend" cmd /k "cd /d C:\GrimWebDashboard\backend && npm install && node server.js"

timeout /t 3 /nobreak > nul

echo Starting Frontend on port 3000...
start "Frontend" cmd /k "cd /d C:\GrimWebDashboard\frontend && npm install && npm start"

echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser
pause
