@echo off
echo ========================================
echo Node.js Installation for Ostora Project
echo ========================================
echo.

echo Checking if Node.js is already installed...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js is already installed!
    node --version
    npm --version
    echo.
    echo You can now run: npm install
    pause
    exit /b 0
)

echo Node.js is not installed. Installing now...
echo.

echo Please choose installation method:
echo 1. Download installer manually (Recommended)
echo 2. Install using winget (Windows 10/11)
echo 3. Exit and install manually
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Opening Node.js download page...
    echo Please download and install Node.js LTS version
    echo After installation, restart this terminal and run: npm install
    start https://nodejs.org/
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo Installing Node.js using winget...
    winget install OpenJS.NodeJS.LTS
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: winget installation failed
        echo Please install manually from: https://nodejs.org/
        pause
        exit /b 1
    )
    echo.
    echo ✓ Node.js installed successfully!
    echo Please restart your terminal and run: npm install
    pause
    exit /b 0
)

if "%choice%"=="3" (
    echo.
    echo Please install Node.js manually from: https://nodejs.org/
    echo Download the LTS version (v20.x.x or v18.x.x)
    echo After installation, restart terminal and run: npm install
    pause
    exit /b 0
)

echo Invalid choice. Please run the script again.
pause
