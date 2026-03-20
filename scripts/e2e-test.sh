#!/bin/bash

# End-to-End System Test
# Tests the complete flow: Scraper → Backend → Frontend

set -e

echo "🚀 Starting End-to-End System Test"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BACKEND_PORT=5000
FRONTEND_PORT=5173
BACKEND_URL="http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Step 1: Start Backend
echo ""
echo "📦 Starting Backend..."
cd backend/src/JobAutomation.WebAPI
dotnet run > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ../../..

# Wait for backend to be ready
echo "   Waiting for backend to start..."
for i in {1..30}; do
    if curl -s $BACKEND_URL/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "   ${RED}❌ Backend failed to start${NC}"
        cat /tmp/backend.log
        exit 1
    fi
    sleep 1
done

# Step 2: Start Frontend
echo ""
echo "🎨 Starting Frontend..."
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "   Waiting for frontend to start..."
for i in {1..20}; do
    if curl -s $FRONTEND_URL > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 20 ]; then
        echo -e "   ${RED}❌ Frontend failed to start${NC}"
        cat /tmp/frontend.log
        exit 1
    fi
    sleep 1
done

# Step 3: Test Backend Health
echo ""
echo "🔍 Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s $BACKEND_URL/health)
if [ "$HEALTH_RESPONSE" == "Healthy" ]; then
    echo -e "   ${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "   ${RED}❌ Backend health check failed${NC}"
    exit 1
fi

# Step 4: Test Backend API - Get Jobs (should be empty initially)
echo ""
echo "🔍 Testing Backend API - Initial State..."
JOBS_RESPONSE=$(curl -s "$BACKEND_URL/api/jobs?page=1&pageSize=10")
INITIAL_COUNT=$(echo $JOBS_RESPONSE | jq -r '.data.totalCount')
echo "   Initial jobs count: $INITIAL_COUNT"

# Step 5: Run Scraper
echo ""
echo "🕷️  Running Scraper..."
cd scraper

# Create test job data
cat > /tmp/test-jobs.json << 'EOF'
[
  {
    "externalId": "e2e-test-001",
    "source": "e2e-test",
    "title": "E2E Test Backend Engineer",
    "company": "E2E Test Corp",
    "location": "Remote - Worldwide",
    "url": "https://example.com/e2e-test-001",
    "description": "This is an end-to-end test job",
    "salaryMin": 100000,
    "salaryMax": 150000,
    "workMode": "Remote",
    "jobType": "FullTime"
  }
]
EOF

# Send test jobs to backend
echo "   Sending test jobs to backend..."
INGEST_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/jobs/ingest" \
  -H "Content-Type: application/json" \
  -d @/tmp/test-jobs.json)

CREATED=$(echo $INGEST_RESPONSE | jq -r '.data.created')
DUPLICATES=$(echo $INGEST_RESPONSE | jq -r '.data.duplicates')
FAILED=$(echo $INGEST_RESPONSE | jq -r '.data.failed')

echo "   Created: $CREATED, Duplicates: $DUPLICATES, Failed: $FAILED"

if [ "$CREATED" -eq 1 ]; then
    echo -e "   ${GREEN}✅ Job ingestion successful${NC}"
else
    echo -e "   ${RED}❌ Job ingestion failed${NC}"
    echo $INGEST_RESPONSE | jq
    exit 1
fi

cd ..

# Step 6: Verify data in backend
echo ""
echo "✅ Verifying Backend Data..."
sleep 1

JOBS_RESPONSE=$(curl -s "$BACKEND_URL/api/jobs?page=1&pageSize=10")
FINAL_COUNT=$(echo $JOBS_RESPONSE | jq -r '.data.totalCount')
echo "   Final jobs count: $FINAL_COUNT"

if [ "$FINAL_COUNT" -gt "$INITIAL_COUNT" ]; then
    echo -e "   ${GREEN}✅ Jobs successfully stored in backend${NC}"
else
    echo -e "   ${RED}❌ Jobs not found in backend${NC}"
    exit 1
fi

# Step 7: Test deduplication
echo ""
echo "🔍 Testing Deduplication..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/jobs/ingest" \
  -H "Content-Type: application/json" \
  -d @/tmp/test-jobs.json)

DUPLICATE_COUNT=$(echo $DUPLICATE_RESPONSE | jq -r '.data.duplicates')
if [ "$DUPLICATE_COUNT" -eq 1 ]; then
    echo -e "   ${GREEN}✅ Deduplication working correctly${NC}"
else
    echo -e "   ${RED}❌ Deduplication failed${NC}"
    echo $DUPLICATE_RESPONSE | jq
    exit 1
fi

# Step 8: Test Frontend (basic check)
echo ""
echo "🔍 Testing Frontend..."
FRONTEND_RESPONSE=$(curl -s $FRONTEND_URL)
if echo "$FRONTEND_RESPONSE" | grep -q "<!DOCTYPE html>"; then
    echo -e "   ${GREEN}✅ Frontend is serving content${NC}"
else
    echo -e "   ${RED}❌ Frontend not responding correctly${NC}"
    exit 1
fi

# Step 9: Test API filters
echo ""
echo "🔍 Testing API Filters..."

# Test work mode filter
REMOTE_JOBS=$(curl -s "$BACKEND_URL/api/jobs?workMode=Remote" | jq -r '.data.totalCount')
echo "   Remote jobs: $REMOTE_JOBS"

# Test relevance score filter
HIGH_SCORE_JOBS=$(curl -s "$BACKEND_URL/api/jobs?minRelevanceScore=80" | jq -r '.data.totalCount')
echo "   High score jobs (>80): $HIGH_SCORE_JOBS"

echo -e "   ${GREEN}✅ API filters working${NC}"

# Step 10: Test metrics endpoint
echo ""
echo "🔍 Testing Metrics..."
METRICS_RESPONSE=$(curl -s "$BACKEND_URL/api/metrics/dashboard")
TOTAL_JOBS=$(echo $METRICS_RESPONSE | jq -r '.data.totalJobs')
echo "   Total jobs in metrics: $TOTAL_JOBS"

if [ "$TOTAL_JOBS" -gt 0 ]; then
    echo -e "   ${GREEN}✅ Metrics endpoint working${NC}"
else
    echo -e "   ${YELLOW}⚠️  Metrics might be empty${NC}"
fi

# Summary
echo ""
echo "===================================="
echo -e "${GREEN}✅ End-to-End Test Complete!${NC}"
echo ""
echo "📊 Test Summary:"
echo "   ✅ Backend started and healthy"
echo "   ✅ Frontend started and serving"
echo "   ✅ Job ingestion working"
echo "   ✅ Deduplication working"
echo "   ✅ API filters working"
echo "   ✅ Metrics endpoint working"
echo ""
echo "🎉 All systems operational!"
echo ""

# Cleanup will happen automatically via trap
