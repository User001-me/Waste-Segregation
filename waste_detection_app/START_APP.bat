@echo off
echo =============================
echo   WasteAI - Starting App
echo =============================

start "WasteAI Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 3 /nobreak > nul

start "WasteAI Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Both servers starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close the terminal windows to stop the app.
pause
