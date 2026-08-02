@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist frontend\dist (
  echo [1/2] Build frontend (pertama kali)...
  call npm run build --prefix frontend || goto :error
)
echo [2/2] Menjalankan LunaPOS di http://localhost:5000
start "" http://localhost:5000
set NODE_ENV=production
node backend\src\index.js
pause
exit /b 0
:error
echo [GAGAL] Pastikan npm install sudah dijalankan (install.bat).
pause
exit /b 1
