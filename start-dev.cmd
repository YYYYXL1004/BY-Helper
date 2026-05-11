@echo off
setlocal

cd /d "%~dp0"
set "npm_config_cache=%CD%\.npm-cache"

echo Starting PG-Tracker from:
echo %CD%
echo npm cache:
echo %npm_config_cache%
echo.

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm.cmd was not found. Please install Node.js first.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\electron-vite.cmd" (
  echo Dependencies are not installed. Running npm.cmd install...
  echo.
  call npm.cmd install --cache "%npm_config_cache%"
  if errorlevel 1 (
    echo.
    echo ERROR: npm.cmd install failed.
    pause
    exit /b 1
  )
  echo.
)

if not exist "node_modules\.prisma\client\index.js" (
  echo Prisma Client is missing. Running npm.cmd run prisma:generate...
  echo.
  call npm.cmd run prisma:generate
  if errorlevel 1 (
    echo.
    echo ERROR: Prisma Client generation failed.
    pause
    exit /b 1
  )
  echo.
)

echo Launching development app...
echo.
call npm.cmd run dev

echo.
echo App exited.
pause
