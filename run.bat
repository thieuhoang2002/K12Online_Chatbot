@echo off
chcp 65001 > nul
echo =====================================================================
echo   KHOI DONG TRO LY AI K12ONLINE - DONG DONG GIAO DUC (NEXT.JS)
echo =====================================================================
echo.

if not exist node_modules (
    echo [1/2] Dang cai dat cac goi thu vien can thiet (npm install)...
    call npm install
)

echo [2/2] Dang khoi dong may chu Next.js tai http://localhost:3000 ...
echo.
timeout /t 3 > nul
start http://localhost:3000
npm run dev
pause
