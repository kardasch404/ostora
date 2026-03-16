#!/bin/bash

echo "🚀 Starting E2E Test Suite for Auth Service"
echo "============================================"

# Check if test database is running
echo "📦 Checking test database..."
docker-compose -f ../../docker-compose.test.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
DATABASE_URL=postgresql://ostora_test:test_password@localhost:5446/ostora_test npx prisma migrate deploy

# Run Supertest E2E tests
echo ""
echo "🧪 Running Supertest E2E Tests..."
npm run test:e2e

# Check if Playwright is installed
if ! command -v playwright &> /dev/null; then
    echo "📥 Installing Playwright browsers..."
    npx playwright install chromium
fi

# Run Playwright tests
echo ""
echo "🎭 Running Playwright E2E Tests..."
npm run test:playwright

echo ""
echo "✅ E2E Test Suite Complete!"
