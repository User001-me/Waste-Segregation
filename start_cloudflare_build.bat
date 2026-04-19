@echo off
setlocal

cd /d "%~dp0waste_detection_app\frontend"
if errorlevel 1 (
  echo Could not enter the frontend folder.
  exit /b 1
)

echo.
echo [WasteAI] Preparing Cloudflare Pages build...

if not exist node_modules (
  echo [WasteAI] Installing frontend dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo [WasteAI] Building production bundle for Cloudflare Pages...
call npm run build:cloudflare
if errorlevel 1 exit /b 1

echo.
echo [WasteAI] Cloudflare-ready build created successfully.
echo Frontend folder  : %cd%
echo Output directory : build
echo.
echo Next steps in Cloudflare Pages:
echo 1. Root directory        = waste_detection_app/frontend
echo 2. Build command         = npm run build
echo 3. Output directory      = build
echo 4. Environment variable  = REACT_APP_API_URL=https://your-backend-domain
echo.
pause
