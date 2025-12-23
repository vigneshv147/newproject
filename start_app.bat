@echo off
echo ==========================================
echo Chameleon Project Launcher
echo ==========================================

cd /d "%~dp0"

echo.
echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed. Checking for Bun...
    call bun install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies with npm or bun.
        echo Please ensure Node.js is installed.
        pause
        exit /b 1
    )
)

echo.
echo [2/2] Starting application...
echo The application will start on http://localhost:5173 (or similar)
echo Please verify the URL in the output below.
echo.

call npm run dev

pause
