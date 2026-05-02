#!/bin/bash

# OSTORA - Quick Start Guide
# Run this script to apply all fixes

echo "🚀 Starting Ostora Application History Fix..."

# Step 1: Run Prisma Migration
echo "📦 Step 1: Running database migration..."
cd "c:\Users\pc\Desktop\ostora"
npx prisma migrate dev --name add_application_history

# Step 2: Generate Prisma Client
echo "🔧 Step 2: Generating Prisma client..."
npx prisma generate

# Step 3: Restart Job Service
echo "🔄 Step 3: Restarting job-service..."
# Kill existing process
taskkill /F /IM node.exe /FI "WINDOWTITLE eq job-service*" 2>nul

# Start job service
cd apps/job-service
npm run start:dev &

# Step 4: Restart Frontend
echo "🎨 Step 4: Restarting frontend..."
cd ../../frontend
npm run dev &

echo "✅ All services restarted!"
echo ""
echo "📊 Test the application:"
echo "1. Open http://localhost:8080/dashboard/application-historys"
echo "2. Check if data loads from backend (not localStorage)"
echo "3. Try creating a new application"
echo "4. Verify stats are dynamic"
echo ""
echo "🔍 Check logs:"
echo "- Job Service: Check console for 'Application history created' messages"
echo "- Frontend: Check browser console for API calls"
echo ""
echo "✅ DONE! Application history is now fully integrated with backend."
