@echo off
echo ========================================
echo OSTORA API ENDPOINT TESTING
echo ========================================
echo.

REM Test 1: Health Check
echo [TEST 1] API Gateway Health Check...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:4717/api/v1/health/liveness
echo.

REM Test 2: Job Service Health
echo [TEST 2] Job Service Health Check...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:4720/health
echo.

REM Test 3: Get Jobs List (Direct to Job Service)
echo [TEST 3] Get Jobs List (Direct Job Service)...
curl -s -o nul -w "Status: %%{http_code}\n" --max-time 10 http://localhost:4720/jobs?page=1^&limit=5
echo.

REM Test 4: Get Job Categories (Direct to Job Service)
echo [TEST 4] Get Job Categories (Direct Job Service)...
curl -s -o nul -w "Status: %%{http_code}\n" --max-time 10 http://localhost:4720/jobs/categories
echo.

REM Test 5: Get Single Job (Direct to Job Service)
echo [TEST 5] Get Single Job ID 16455 (Direct Job Service)...
curl -s -o nul -w "Status: %%{http_code}\n" --max-time 10 http://localhost:4720/jobs/16455
echo.

REM Test 6: Get Jobs via API Gateway
echo [TEST 6] Get Jobs via API Gateway...
curl -s -o nul -w "Status: %%{http_code}\n" --max-time 10 http://localhost:4717/api/v1/jobs?page=1^&limit=5
echo.

REM Test 7: Get Categories via API Gateway
echo [TEST 7] Get Categories via API Gateway...
curl -s -o nul -w "Status: %%{http_code}\n" --max-time 10 http://localhost:4717/api/v1/jobs/categories
echo.

REM Test 8: Get Single Job via API Gateway
echo [TEST 8] Get Single Job ID 16455 via API Gateway...
curl -s -o nul -w "Status: %%{http_code}\n" --max-time 10 http://localhost:4717/api/v1/jobs/16455
echo.

echo ========================================
echo TEST SUMMARY
echo ========================================
echo All tests should return Status: 200
echo If any test shows Status: 000 or timeout, there is a problem
echo.
pause
