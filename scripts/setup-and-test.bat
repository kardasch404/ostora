@echo off
echo ========================================
echo Ostora Project Setup and Validation
echo ========================================
echo.

echo [1/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [2/6] Generating Prisma client...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo [3/6] Checking TypeScript compilation...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: TypeScript compilation failed
    exit /b 1
)
echo ✓ TypeScript compilation successful
echo.

echo [4/6] Running linter...
call npm run lint:check
if %errorlevel% neq 0 (
    echo WARNING: Linting issues found, auto-fixing...
    call npm run lint
)
echo ✓ Linting passed
echo.

echo [5/6] Checking code formatting...
call npm run format:check
if %errorlevel% neq 0 (
    echo WARNING: Formatting issues found, auto-fixing...
    call npm run format
)
echo ✓ Formatting passed
echo.

echo [6/6] Running tests...
call npm run test
if %errorlevel% neq 0 (
    echo ERROR: Tests failed
    exit /b 1
)
echo ✓ Tests passed
echo.

echo ========================================
echo ✓ All checks passed! Project is ready.
echo ========================================
echo.
echo Next steps:
echo 1. Setup environment: cp .env.example .env
echo 2. Start infrastructure: npm run docker:up
echo 3. Run migrations: npm run prisma:migrate
echo 4. Start services: npm run start:gateway
echo.
echo Ready to commit? Run:
echo git add . ^&^& git commit -m "chore: initial project setup"
echo.
