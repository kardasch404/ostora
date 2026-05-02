@echo off
echo ========================================
echo OSTORA PRODUCTION FIX - BUILD ERRORS
echo ========================================
echo.
echo This script will:
echo 1. Stop and remove containers
echo 2. Rebuild job-service with fixes
echo 3. Start all services
echo 4. Wait for health checks
echo 5. Test endpoints
echo.
pause

echo.
echo [STEP 1] Stopping and removing containers...
docker-compose down job-service api-gateway

echo.
echo [STEP 2] Rebuilding services with fixes...
docker-compose build --no-cache job-service api-gateway

echo.
echo [STEP 3] Starting services...
docker-compose up -d

echo.
echo [STEP 4] Waiting 40 seconds for services to start...
ping -n 40 127.0.0.1 >nul

echo.
echo [STEP 5] Testing endpoints...
echo.
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/health/liveness' -TimeoutSec 5 -UseBasicParsing; Write-Host 'API Gateway Health: OK ('$r.StatusCode')' -ForegroundColor Green } catch { Write-Host 'API Gateway Health: FAILED' -ForegroundColor Red }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4720/api/v1/health' -TimeoutSec 5 -UseBasicParsing; Write-Host 'Job Service Health: OK ('$r.StatusCode')' -ForegroundColor Green } catch { Write-Host 'Job Service Health: FAILED' -ForegroundColor Red }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/jobs/categories' -TimeoutSec 10 -UseBasicParsing; Write-Host 'Job Categories: OK ('$r.StatusCode')' -ForegroundColor Green } catch { Write-Host 'Job Categories: FAILED' -ForegroundColor Red }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/jobs?page=1&limit=5' -TimeoutSec 10 -UseBasicParsing; Write-Host 'Job List: OK ('$r.StatusCode')' -ForegroundColor Green } catch { Write-Host 'Job List: FAILED' -ForegroundColor Red }"

echo.
echo ========================================
echo FIX COMPLETE
echo ========================================
echo.
echo If all tests show OK, the fix is successful.
echo If any test shows FAILED, check docker logs:
echo   docker logs ostora-api-gateway --tail 50
echo   docker logs ostora-job-service --tail 50
echo.
pause
