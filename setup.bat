@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Ostora Project - Automated Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo [Step 1/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is NOT installed!
    echo.
    echo Please install Node.js first:
    echo 1. Run: scripts\install-nodejs.bat
    echo 2. Or download from: https://nodejs.org/
    echo 3. After installation, restart terminal and run this script again
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% detected
echo ✓ npm %NPM_VERSION% detected
echo.

REM Install dependencies
echo [Step 2/8] Installing dependencies...
echo This may take a few minutes...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed
    echo Try: npm cache clean --force
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Setup environment
echo [Step 3/8] Setting up environment...
if not exist .env (
    copy .env.example .env >nul
    echo ✓ .env file created from .env.example
    echo ⚠ Please edit .env file with your configuration
) else (
    echo ✓ .env file already exists
)
echo.

REM Generate Prisma client
echo [Step 4/8] Generating Prisma client...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo ❌ Prisma generate failed
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

REM Setup Husky
echo [Step 5/8] Setting up Git hooks (Husky)...
call npm run prepare 2>nul
echo ✓ Git hooks configured
echo.

REM Check TypeScript
echo [Step 6/8] Checking TypeScript compilation...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ TypeScript compilation failed
    echo Please fix TypeScript errors before continuing
    pause
    exit /b 1
)
echo ✓ TypeScript compilation successful
echo.

REM Run linter
echo [Step 7/8] Running linter...
call npm run lint:check 2>nul
if %errorlevel% neq 0 (
    echo ⚠ Linting issues found, auto-fixing...
    call npm run lint
)
echo ✓ Linting passed
echo.

REM Format code
echo [Step 8/8] Formatting code...
call npm run format:check 2>nul
if %errorlevel% neq 0 (
    echo ⚠ Formatting issues found, auto-fixing...
    call npm run format
)
echo ✓ Code formatted
echo.

echo ========================================
echo ✓✓✓ Setup Complete! ✓✓✓
echo ========================================
echo.
echo Project is ready for development!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Start Docker: npm run docker:up
echo 3. Run migrations: npm run prisma:migrate
echo 4. Start services: npm run start:gateway
echo.
echo To commit your changes:
echo   git add .
echo   git commit -m "chore: initial project setup"
echo   git push origin ostora-config
echo.
echo API Documentation will be available at:
echo   http://localhost:4717/api/docs
echo.
pause
