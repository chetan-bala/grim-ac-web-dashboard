@echo off
cd /d C:\GrimWebDashboard\backend
start /min cmd /k "npm install && node server.js"
timeout /t 3 /nobreak > nul
cd /d C:\GrimWebDashboard\frontend
start /min cmd /k "npm install && npm start"
