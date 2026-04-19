@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%waste_detection_app\frontend"
set "BACKEND=%ROOT%waste_detection_app\backend"

echo.
echo [WasteAI] Starting local development environment...

if not exist "%FRONTEND%\package.json" (
  echo [WasteAI] Frontend folder not found.
  exit /b 1
)

if not exist "%BACKEND%\main.py" (
  echo [WasteAI] Backend folder not found.
  exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
  echo [WasteAI] Installing frontend dependencies...
  call npm --prefix "%FRONTEND%" install
  if errorlevel 1 exit /b 1
)

echo [WasteAI] Opening backend at http://localhost:8000
start "WasteAI Backend" cmd /k "cd /d ""%BACKEND%"" && python main.py"

echo [WasteAI] Opening frontend at http://localhost:3000
start "WasteAI Frontend" cmd /k "cd /d ""%FRONTEND%"" && npm start"

echo.
echo [WasteAI] Local app launch requested.
echo Backend  : http://localhost:8000
echo Frontend : http://localhost:3000
echo Docs     : http://localhost:8000/docs
echo.
pause
