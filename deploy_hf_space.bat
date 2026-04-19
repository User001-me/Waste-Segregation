@echo off
setlocal

cd /d "%~dp0"
if errorlevel 1 (
  echo Could not enter the project root.
  exit /b 1
)

echo.
echo [WasteAI] Checking Hugging Face authentication...
if "%HF_TOKEN%"=="" (
  hf auth whoami >nul 2>nul
  if errorlevel 1 (
    echo [WasteAI] You are not logged in locally and HF_TOKEN is not set.
    echo Create a WRITE token at:
    echo https://huggingface.co/settings/tokens
    echo.
    set /p HF_TOKEN=Paste your Hugging Face write token here: 
  )
)

echo [WasteAI] Deploying backend Space...
python deploy_hf_space.py
if errorlevel 1 exit /b 1

echo.
echo [WasteAI] Hugging Face backend deployment finished.
pause
