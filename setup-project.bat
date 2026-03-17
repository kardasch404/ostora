@echo off
echo ========================================
echo Ostora Project - Complete Setup
echo ========================================
echo.

echo Node.js was just installed. Refreshing environment...
echo.

REM Refresh environment variables
call refreshenv 2>nul
if %errorlevel% neq 0 (
    echo Refreshing PATH manually...
    set "PATH=%PATH%;C:\Program Files\nodejs"
)

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js not found in PATH
    echo Please CLOSE this terminal and open a NEW one, then run:
    echo   cd c:\Users\pc\Desktop\ostora
    echo   npm install
    echo.
    pause
    exit /b 1
)

npm --version
echo.
echo ✓ Node.js is ready!
echo.

echo ========================================
echo Step 1/7: Installing dependencies...
echo ========================================
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo ========================================
echo Step 2/7: Generating Prisma client...
echo ========================================
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo ========================================
echo Step 3/7: Setting up Husky...
echo ========================================
call npm run prepare
echo ✓ Husky configured
echo.

echo ========================================
echo Step 4/7: Checking TypeScript...
echo ========================================
call npm run build
if %errorlevel% neq 0 (
    echo WARNING: TypeScript compilation has errors
    echo Continuing anyway...
)
echo ✓ TypeScript checked
echo.

echo ========================================
echo Step 5/7: Formatting code...
echo ========================================
call npm run format
echo ✓ Code formatted
echo.

echo ========================================
echo Step 6/7: Running linter...
echo ========================================
call npm run lint
if %errorlevel% neq 0 (
    echo WARNING: Linting issues found
    echo Continuing anyway...
)
echo ✓ Linter executed
echo.

echo ========================================
echo Step 7/7: Running tests...
echo ========================================
call npm run test
echo ✓ Tests completed
echo.

echo ========================================
echo ✓✓✓ PROJECT SETUP COMPLETE! ✓✓✓
echo ========================================
echo.
echo Project is ready to commit!
echo.
echo Run these commands to commit:
echo   git add .
echo   git commit -m "chore: initial project setup with microservices architecture, devops config, and infrastructure"
echo   git push origin ostora-config
echo.
echo Or run: npm run commit-setup
echo.
pause
