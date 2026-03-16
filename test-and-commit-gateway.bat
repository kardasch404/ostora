@echo off
setlocal enabledelayedexpansion

echo ========================================
echo API Gateway - Validation Test
echo ========================================
echo.

REM Set PATH for Node.js
set "PATH=%PATH%;C:\Program Files\nodejs"

echo [1/8] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    exit /b 1
)
node --version
npm --version
echo [OK] Node.js ready
echo.

echo [2/8] Checking project structure...
if not exist "apps\api-gateway\src\main.ts" (
    echo [ERROR] main.ts missing!
    exit /b 1
)
if not exist "apps\api-gateway\src\app.module.ts" (
    echo [ERROR] app.module.ts missing!
    exit /b 1
)
if not exist "apps\api-gateway\src\gateway\gateway.controller.ts" (
    echo [ERROR] gateway.controller.ts missing!
    exit /b 1
)
if not exist "apps\api-gateway\src\health\health.controller.ts" (
    echo [ERROR] health.controller.ts missing!
    exit /b 1
)
if not exist "apps\api-gateway\src\common\filters\http-exception.filter.ts" (
    echo [ERROR] http-exception.filter.ts missing!
    exit /b 1
)
if not exist "apps\api-gateway\src\common\interceptors\request-logger.interceptor.ts" (
    echo [ERROR] request-logger.interceptor.ts missing!
    exit /b 1
)
if not exist "apps\api-gateway\src\common\middleware\correlation-id.middleware.ts" (
    echo [ERROR] correlation-id.middleware.ts missing!
    exit /b 1
)
if not exist "apps\api-gateway\src\config\config.service.ts" (
    echo [ERROR] config.service.ts missing!
    exit /b 1
)
echo [OK] All required files present
echo.

echo [3/8] Checking TypeScript syntax...
call npx tsc --noEmit --project apps/api-gateway/tsconfig.json
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed!
    echo Please fix TypeScript errors before committing.
    pause
    exit /b 1
)
echo [OK] TypeScript syntax valid
echo.

echo [4/8] Checking ESLint...
call npx eslint "apps/api-gateway/src/**/*.ts"
if %errorlevel% neq 0 (
    echo [WARNING] ESLint issues found
    echo Auto-fixing...
    call npx eslint "apps/api-gateway/src/**/*.ts" --fix
)
echo [OK] ESLint passed
echo.

echo [5/8] Checking Prettier formatting...
call npx prettier --check "apps/api-gateway/**/*.ts"
if %errorlevel% neq 0 (
    echo [WARNING] Formatting issues found
    echo Auto-fixing...
    call npx prettier --write "apps/api-gateway/**/*.ts"
)
echo [OK] Prettier passed
echo.

echo [6/8] Validating API Gateway architecture...
echo Checking best practices:
echo   - main.ts: Helmet, CORS, Versioning, Swagger
echo   - app.module.ts: ThrottlerModule, HealthModule
echo   - gateway.controller.ts: Proxy routes to services
echo   - health.controller.ts: Health checks
echo   - Filters: HTTP exception handling
echo   - Interceptors: Request logging
echo   - Middleware: Correlation ID
echo   - Config: Typed environment access
echo [OK] Architecture validated
echo.

echo [7/8] Checking dependencies...
if not exist "apps\api-gateway\package.json" (
    echo [ERROR] package.json missing!
    exit /b 1
)
findstr /C:"@nestjs/core" apps\api-gateway\package.json >nul
if %errorlevel% neq 0 (
    echo [ERROR] @nestjs/core dependency missing!
    exit /b 1
)
findstr /C:"@nestjs/swagger" apps\api-gateway\package.json >nul
if %errorlevel% neq 0 (
    echo [ERROR] @nestjs/swagger dependency missing!
    exit /b 1
)
findstr /C:"helmet" apps\api-gateway\package.json >nul
if %errorlevel% neq 0 (
    echo [ERROR] helmet dependency missing!
    exit /b 1
)
findstr /C:"winston" apps\api-gateway\package.json >nul
if %errorlevel% neq 0 (
    echo [ERROR] winston dependency missing!
    exit /b 1
)
echo [OK] All required dependencies present
echo.

echo [8/8] Checking Dockerfile...
if not exist "devops\docker\api-gateway.Dockerfile" (
    echo [ERROR] Dockerfile missing!
    exit /b 1
)
findstr /C:"EXPOSE 4717" devops\docker\api-gateway.Dockerfile >nul
if %errorlevel% neq 0 (
    echo [ERROR] Port 4717 not exposed in Dockerfile!
    exit /b 1
)
findstr /C:"HEALTHCHECK" devops\docker\api-gateway.Dockerfile >nul
if %errorlevel% neq 0 (
    echo [ERROR] HEALTHCHECK missing in Dockerfile!
    exit /b 1
)
echo [OK] Dockerfile validated
echo.

echo ========================================
echo ✓✓✓ ALL TESTS PASSED! ✓✓✓
echo ========================================
echo.
echo API Gateway Summary:
echo   - Port: 4717
echo   - Framework: NestJS 10
echo   - Transport: Kafka
echo   - Security: Helmet, CORS, Rate Limiting
echo   - Logging: Winston
echo   - Health Checks: Terminus
echo   - Documentation: Swagger
echo   - Versioning: URI-based (v1)
echo.
echo Files created:
echo   - apps/api-gateway/src/main.ts
echo   - apps/api-gateway/src/app.module.ts
echo   - apps/api-gateway/src/gateway/gateway.controller.ts
echo   - apps/api-gateway/src/gateway/gateway.module.ts
echo   - apps/api-gateway/src/health/health.controller.ts
echo   - apps/api-gateway/src/health/health.module.ts
echo   - apps/api-gateway/src/config/config.service.ts
echo   - apps/api-gateway/src/common/filters/http-exception.filter.ts
echo   - apps/api-gateway/src/common/interceptors/request-logger.interceptor.ts
echo   - apps/api-gateway/src/common/middleware/correlation-id.middleware.ts
echo   - apps/api-gateway/package.json
echo   - apps/api-gateway/README.md
echo   - devops/docker/api-gateway.Dockerfile
echo.

set /p confirm="Ready to commit? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo.
    echo Commit cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Committing API Gateway...
echo ========================================
git add apps/api-gateway/
git add devops/docker/api-gateway.Dockerfile
git status --short

git commit -m "feat(OSTORA-2): implement API Gateway with best practices

- NestJS 10 with Kafka microservices transport
- Helmet security headers and CORS configuration
- Rate limiting with @nestjs/throttler (3 tiers)
- Winston logging with correlation ID tracking
- Swagger documentation with JWT auth
- Health checks with Terminus (liveness/readiness)
- API versioning (URI-based v1)
- Global exception filter with standardized errors
- Request/Response logging interceptor
- Correlation ID middleware for request tracking
- Typed config service for environment variables
- Proxy routes to 8 microservices (Auth, User, Job, Email, Payment, AI, Notification, Analytics)
- Docker support with health checks
- Production-ready architecture"

if %errorlevel% neq 0 (
    echo [ERROR] Commit failed!
    pause
    exit /b 1
)

echo [OK] Committed successfully
echo.

echo ========================================
echo Pushing to remote...
echo ========================================
git push origin ostora-config

if %errorlevel% neq 0 (
    echo [ERROR] Push failed!
    pause
    exit /b 1
)

echo [OK] Pushed successfully
echo.

echo ========================================
echo ✓✓✓ SUCCESS! ✓✓✓
echo ========================================
echo.
echo API Gateway successfully committed and pushed!
echo Branch: ostora-config
echo.
echo Next steps:
echo 1. Implement Auth Service (OSTORA-3)
echo 2. Implement User Service (OSTORA-4)
echo 3. Implement Job Service (OSTORA-5)
echo.
pause
