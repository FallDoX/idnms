@echo off
echo ============================================
echo Building Trip Log Analyzer
echo ============================================
echo.

echo [1/2] Building...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.

echo [2/2] Build completed!
echo.
echo Open dist\index.html in your browser
echo Or run: start.bat
echo.
pause
