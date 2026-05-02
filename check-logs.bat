@echo off
echo ========================================
echo OSTORA - CHECK LOGS
echo ========================================
echo.

echo [API Gateway Logs - Last 30 lines]
echo ----------------------------------------
docker logs ostora-api-gateway --tail 30
echo.

echo [Job Service Logs - Last 30 lines]
echo ----------------------------------------
docker logs ostora-job-service --tail 30
echo.

echo [User Service Logs - Last 30 lines]
echo ----------------------------------------
docker logs ostora-user-service --tail 30
echo.

echo ========================================
echo.
pause
