@echo off
echo ========================================
echo Starting React Frontend (CHAMELEON)
echo ========================================
echo.

cd /d "%~dp0"

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local file...
    echo VITE_FLASK_API_URL=http://localhost:5000 > .env.local
    echo Created .env.local with Flask API URL
    echo.
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    
    REM Try bun first, fall back to npm
    where bun >nul 2>&1
    if errorlevel 1 (
        echo Using npm...
        call npm install
    ) else (
        echo Using bun...
        call bun install
    )
    
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Starting development server...
echo ========================================
echo.
echo The app will open in your browser automatically
echo Press Ctrl+C to stop the server
echo.

REM Try bun first, fall back to npm
where bun >nul 2>&1
if errorlevel 1 (
    call npm run dev
) else (
    call bun run dev
)

pause
