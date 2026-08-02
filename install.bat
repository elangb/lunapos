@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   LunaPOS - Instalasi (jalankan SEKALI saja)
echo ============================================
echo.
echo [1/4] Install dependencies (root, backend, frontend)...
call npm install || goto :error
call npm install --prefix backend || goto :error
call npm install --prefix frontend || goto :error
echo.
echo [2/4] Setup .env (JWT_SECRET acak)...
call npm run setup:env --prefix backend || goto :error
echo.
echo [3/4] Inisialisasi database...
echo      Pastikan Laragon (MySQL) sudah Start All!
call npm run db:init --prefix backend || goto :error
echo.
echo [4/4] Build frontend...
call npm run build --prefix frontend || goto :error
echo.
echo ============================================
echo   Selesai! Jalankan start.bat untuk memulai.
echo ============================================
pause
exit /b 0
:error
echo.
echo [GAGAL] Pastikan Node.js LTS dan Laragon (MySQL) sudah terinstall dan jalan.
pause
exit /b 1
