@echo off
title BingoVE - Sistema Completo
color 0A

echo.
echo ========================================
echo   BINGO VE - INICIANDO SISTEMA
echo ========================================
echo.
echo [1/2] Arrancando servidor web...
start "BingoVE Web" cmd /k "cd /d C:\Users\EQUIPO\Desktop\5-en-linea && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Arrancando bot de WhatsApp...
start "BingoVE Bot" cmd /k "cd /d C:\Users\EQUIPO\Desktop\5-en-linea\bot && node bot.js"

echo.
echo ========================================
echo   SISTEMA ACTIVO
echo ========================================
echo.
echo Web Admin: http://localhost:3000/admin
echo Web Publica: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana
echo (Las otras 2 ventanas seguiran activas)
pause >nul
