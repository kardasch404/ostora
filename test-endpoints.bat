@echo off
echo ========================================
echo OSTORA - QUICK TEST
echo ========================================
echo.
echo Testing all endpoints...
echo.

echo [1] API Gateway Health...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/health/liveness' -TimeoutSec 5 -UseBasicParsing; Write-Host '   Status: '$r.StatusCode -ForegroundColor Green } catch { Write-Host '   FAILED: '$_.Exception.Message -ForegroundColor Red }"

echo.
echo [2] Job Service Health...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4720/api/v1/health' -TimeoutSec 5 -UseBasicParsing; Write-Host '   Status: '$r.StatusCode -ForegroundColor Green } catch { Write-Host '   FAILED: '$_.Exception.Message -ForegroundColor Red }"

echo.
echo [3] User Service Health...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4719/api/v1/health' -TimeoutSec 5 -UseBasicParsing; Write-Host '   Status: '$r.StatusCode -ForegroundColor Green } catch { Write-Host '   FAILED: '$_.Exception.Message -ForegroundColor Red }"

echo.
echo [4] Job Categories...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/jobs/categories' -TimeoutSec 10 -UseBasicParsing; Write-Host '   Status: '$r.StatusCode -ForegroundColor Green } catch { Write-Host '   FAILED: '$_.Exception.Message -ForegroundColor Red }"

echo.
echo [5] Job List (page 1)...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/jobs?page=1&limit=5' -TimeoutSec 10 -UseBasicParsing; Write-Host '   Status: '$r.StatusCode -ForegroundColor Green } catch { Write-Host '   FAILED: '$_.Exception.Message -ForegroundColor Red }"

echo.
echo [6] Job List (with empty params)...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4717/api/v1/jobs?page=1&limit=20&search=&category=&location=&country=' -TimeoutSec 10 -UseBasicParsing; Write-Host '   Status: '$r.StatusCode -ForegroundColor Green } catch { Write-Host '   FAILED: '$_.Exception.Message -ForegroundColor Red }"

echo.
echo [7] Frontend...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080' -TimeoutSec 5 -UseBasicParsing; Write-Host '   Status: '$r.StatusCode -ForegroundColor Green } catch { Write-Host '   FAILED: '$_.Exception.Message -ForegroundColor Red }"

echo.
echo ========================================
echo TEST COMPLETE
echo ========================================
echo.
echo If any test failed, run:
echo   check-logs.bat     - View logs
echo   rebuild-all.bat    - Full rebuild
echo.
pause
