@echo off
echo ========================================
echo OSTORA - Application History Fix
echo ========================================
echo.

cd /d "c:\Users\pc\Desktop\ostora"

echo Step 1: Running database migration...
call npx prisma migrate dev --name add_application_history
if %errorlevel% neq 0 (
    echo ERROR: Migration failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Installation complete!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Restart your job-service
echo 2. Restart your frontend
echo 3. Open http://localhost:8080/dashboard/application-historys
echo 4. Data should now load from database!
echo.
echo ========================================
echo TESTING:
echo ========================================
echo - Check browser console for API calls
echo - Verify stats are dynamic
echo - Try creating new application
echo - Check if localStorage syncs to DB
echo.
pause
