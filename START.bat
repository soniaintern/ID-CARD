@echo off
setlocal
cd /d "%~dp0"
title ID Card Generator - Bulk Tool

echo ================================================
echo   ID Card Generator  (Bulk + Single)
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo.
  echo   1^) Open https://nodejs.org
  echo   2^) Download and install the "LTS" version
  echo   3^) Close this window and run START.bat again
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First-time setup is running - this takes 1 to 2 minutes...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed. Please check your internet connection.
    pause
    exit /b 1
  )
)

echo.
echo Starting the tool... the browser will open in about 8 seconds.
echo To stop, press Ctrl + C in this window.
echo.

start "" /b cmd /c "timeout /t 8 /nobreak >nul & explorer http://localhost:5173"

call npm run dev

echo.
echo The server has stopped.
pause
endlocal
