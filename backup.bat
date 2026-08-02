@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Backup database LunaPOS...
echo Hasil disimpan di backend\backups\ - salin ke flashdisk/cloud secara berkala!
echo.
call npm run backup --prefix backend
echo.
pause
