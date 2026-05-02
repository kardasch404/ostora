@echo off
echo ========================================
echo OSTORA - FULL REBUILD
echo ========================================
echo.
echo This will:
echo 1. Stop all containers
echo 2. Remove old images
echo 3. Rebuild everything
echo 4. Start services
echo 5. Run tests
echo.
echo WARNING: This may take 5-10 minutes
echo.
pause

echo.
echo [1/5] Stopping all containers...
docker-compose down

echo.
echo [2/5] Removing old images...
docker rmi ostora-job-service ostora-api-gateway ostora-user-service 2>nul

echo.
echo [3/5] Rebuilding all services (this takes time)...
docker-compose build --no-cache

echo.
echo [4/5] Starting all services...
docker-compose up -d

echo.
echo [5/5] Waiting 60 seconds for services to initialize...
ping -n 60 127.0.0.1 >nul

echo.
echo ========================================
echo TESTING ENDPOINTS
echo ========================================
echo.

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/health/liveness' -TimeoutSec 5 -UseBasicParsing; Write-Host 'API Gateway: OK' -ForegroundColor Green } catch { Write-Host 'API Gateway: FAILED' -ForegroundColor Red }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4720/api/v1/health' -TimeoutSec 5 -UseBasicParsing; Write-Host 'Job Service: OK' -ForegroundColor Green } catch { Write-Host 'Job Service: FAILED' -ForegroundColor Red }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4719/api/v1/health' -TimeoutSec 5 -UseBasicParsing; Write-Host 'User Service: OK' -ForegroundColor Green } catch { Write-Host 'User Service: FAILED' -ForegroundColor Red }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/jobs/categories' -TimeoutSec 10 -UseBasicParsing; Write-Host 'Job Categories: OK' -ForegroundColor Green } catch { Write-Host 'Job Categories: FAILED' -ForegroundColor Red }"

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/jobs?page=1&limit=5' -TimeoutSec 10 -UseBasicParsing; Write-Host 'Job List: OK' -ForegroundColor Green } catch { Write-Host 'Job List: FAILED' -ForegroundColor Red }"

echo.
echo ========================================
echo REBUILD COMPLETE
echo ========================================
echo.
echo Frontend: http://localhost:8080
echo API Gateway: http://localhost:4717/api/v1/docs
echo Job Service: http://localhost:4720/api/v1/docs
echo.
echo If tests failed, run: check-logs.bat
echo.
pause
