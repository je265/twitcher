@echo off
echo 🚀 Running Twitcher Worker Debug Script
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found in PATH
    echo Please install Python or add it to your PATH
    pause
    exit /b 1
)

REM Check if requirements are installed
echo 🔍 Checking Python dependencies...
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo ❌ Python requests module not found
    echo Installing requirements...
    pip install -r apps/python-worker/requirements.txt
)

echo.
echo 🧪 Running debug tests...
python test-worker-debug.py

echo.
pause
