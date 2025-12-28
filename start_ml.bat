@echo off
cd ml_service
py -3.11 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ML ERROR] Python 3.11 not found! Please check installation.
    exit /b 1
)
echo [ML] Starting Python Service (py -3.11)...
py -3.11 app.py
if %errorlevel% neq 0 (
    echo [ML ERROR] Python service crashed or failed to start.
)
