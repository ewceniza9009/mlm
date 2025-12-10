@echo off
echo Starting Binary MLM Application...

REM Start Backend 
start "MLM Backend" cmd /k "cd ..\backend && npm start"

REM Start Frontend
start "MLM Frontend" cmd /k "cd ..\frontend && npm run dev"

echo Servers are launching...
exit
