@echo off
chcp 65001 >nul
echo ==========================================
echo   Trip Log Analyzer v2.0.0 - Production
echo ==========================================
echo.
echo [1] Запустить Web App
echo [2] Запустить Telegram Bot
echo [3] Установить зависимости Bot
echo [4] Выход
echo.
set /p choice="Выберите опцию (1-4): "

if "%choice%"=="1" goto web
if "%choice%"=="2" goto bot
if "%choice%"=="3" goto install
if "%choice%"=="4" goto exit

goto end

:web
echo.
echo Запуск Web App на http://localhost:5174
cd web
npx serve . -l 5174
goto end

:bot
echo.
echo Запуск Telegram Bot...
cd bot
if not exist .env (
  echo ВНИМАНИЕ: Создайте файл .env с BOT_TOKEN=your_token
  pause
)
npm start
goto end

:install
echo.
echo Установка зависимостей Bot...
cd bot
npm install
echo.
echo Готово! Создайте файл .env с BOT_TOKEN=your_token
goto end

:exit
exit

:end
pause
