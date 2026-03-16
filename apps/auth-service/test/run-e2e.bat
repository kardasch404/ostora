@echo off
echo Starting E2E Test Suite for Auth Service
echo ============================================

echo Checking test database...
docker-compose -f ..\..\docker-compose.test.yml up -d

echo Waiting for database to be ready...
timeout /t 5 /nobreak > nul

echo Running database migrations...
set DATABASE_URL=postgresql://ostora_test:test_password@localhost:5446/ostora_test
npx prisma migrate deploy

echo.
echo Running Supertest E2E Tests...
npm run test:e2e

echo.
echo Running Playwright E2E Tests...
npm run test:playwright

echo.
echo E2E Test Suite Complete!
