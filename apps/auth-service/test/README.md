# Auth Service E2E Tests

## Overview
Comprehensive E2E tests for auth-service using Supertest and Playwright.

## Test Coverage

### Supertest E2E Tests
- **auth-login.e2e-spec.ts**: Login, registration, token refresh
- **auth-sessions.e2e-spec.ts**: Logout, session management, session revocation
- **auth-security.e2e-spec.ts**: Brute-force protection, password reset flow

### Playwright E2E Tests
- **auth-flow.spec.ts**: Full browser-based authentication flows

## Setup

### 1. Start Test Database
```bash
docker-compose -f docker-compose.test.yml up -d
```

### 2. Run Database Migrations
```bash
DATABASE_URL=postgresql://ostora_test:test_password@localhost:5446/ostora_test npx prisma migrate deploy
```

### 3. Install Playwright Browsers
```bash
npx playwright install chromium
```

## Running Tests

### Supertest E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run in watch mode
npm run test:e2e:watch

# Run specific test file
npm run test:e2e -- auth-login.e2e-spec.ts
```

### Playwright Tests
```bash
# Run all Playwright tests
npm run test:playwright

# Run with UI mode
npm run test:playwright:ui

# Run in debug mode
npm run test:playwright:debug
```

## Test Database

Tests use a separate test database to avoid conflicts:
- **Host**: localhost:5446
- **Database**: ostora_test
- **User**: ostora_test
- **Password**: test_password

Each test suite cleans up data in `beforeEach` hooks.

## Environment Variables

Tests use `.env.test` configuration:
- `NODE_ENV=test`
- `DATABASE_URL=postgresql://ostora_test:test_password@localhost:5446/ostora_test`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6346`

## Test Scenarios

### Login & Registration
- ✅ Valid credentials return 200 with tokens
- ✅ Invalid credentials return 401
- ✅ Non-existent user returns 401

### Token Refresh
- ✅ Valid refresh token rotates tokens
- ✅ Invalid refresh token returns 401

### Logout & Sessions
- ✅ Logout clears cookies and returns 200
- ✅ Get sessions returns active session list
- ✅ Delete specific session revokes it
- ✅ Delete all sessions logs out everywhere

### Brute-force Protection
- ✅ 5 failed attempts trigger lockout (429)
- ✅ Lockout expires after timeout

### Password Reset
- ✅ Forgot password sends reset email
- ✅ Reset password with valid token succeeds
- ✅ Invalid reset token returns 400

## Cleanup

Stop test database:
```bash
docker-compose -f docker-compose.test.yml down -v
```
