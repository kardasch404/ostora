@echo off
echo ========================================
echo OSTORA - DOCKER CLEANUP
echo ========================================
echo.
echo WARNING: This will:
echo - Stop all Ostora containers
echo - Remove all Ostora containers
echo - Remove all Ostora images
echo - Keep volumes (data preserved)
echo.
echo Press Ctrl+C to cancel
pause

echo.
echo [1/4] Stopping all containers...
docker-compose down

echo.
echo [2/4] Removing Ostora containers...
docker rm -f ostora-api-gateway ostora-job-service ostora-user-service ostora-auth-service ostora-email-service ostora-payment-service ostora-notification-service ostora-ostoracv-service ostora-ai-service ostora-frontend 2>nul

echo.
echo [3/4] Removing Ostora images...
docker rmi ostora-api-gateway ostora-job-service ostora-user-service ostora-auth-service ostora-email-service ostora-payment-service ostora-notification-service ostora-ostoracv-service ostora-ai-service ostora-frontend 2>nul

echo.
echo [4/4] Cleaning Docker system...
docker system prune -f

echo.
echo ========================================
echo CLEANUP COMPLETE
echo ========================================
echo.
echo Next steps:
echo   1. Run: rebuild-all.bat
echo   2. Wait for services to start
echo   3. Test: test-endpoints.bat
echo.
pause
