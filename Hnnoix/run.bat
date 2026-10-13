@echo off
title Fortis Vault - Secure Banking Dashboard
color 0b
echo ======================================================================
echo   Starting Fortis Secure Banking Application...
echo ======================================================================
echo.

cd /d "%~dp0"
start http://localhost:5000
node backend/server.js
pause
