#!/bin/bash

# End-to-End Demo Preparation Script
# This script prepares the entire system for a demo

set -e

echo "🎬 Preparing Job Automation System Demo"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="jobautomation"
DB_USER="postgres"
BACKEND_PORT=5000
FRONTEND_PORT=5173

# Step 1: Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client not found${NC}"
    exit 1
fi

if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ .NET SDK not found${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Step 2: Reset database
echo ""
echo "🗄️  Resetting database..."

psql -U $DB_USER -d $DB_NAME -c "
TRUNCATE TABLE \"Applications\" CASCADE;
TRUNCATE TABLE \"Jobs\" CASCADE;
TRUNCATE TABLE \"Companies\" CASCADE;
TRUNCATE TABLE \"Metrics\" CASCADE;
" 2>/dev/null || echo -e "${YELLOW}⚠️  Database might be empty${NC}"

echo -e "${GREEN}✅ Database reset${NC}"

# Step 3: Seed test data
echo ""
echo "📊 Seeding test data..."

psql -U $DB_USER -d $DB_NAME << 'EOF'
-- Insert test companies
INSERT INTO "Companies" ("Id", "Name", "Website", "Industry", "Location", "CreatedAt", "UpdatedAt")
VALUES 
  (gen_random_uuid(), 'TechCorp Solutions', 'https://techcorp.com', 'Software Development', 'San Francisco, CA', NOW(), NOW()),
  (gen_random_uuid(), 'StartupXYZ', 'https://startupxyz.com', 'FinTech', 'New York, NY', NOW(), NOW()),
  (gen_random_uuid(), 'CloudTech Inc', 'https://cloudtech.io', 'Cloud Services', 'Remote', NOW(), NOW());

-- Insert test jobs
INSERT INTO "Jobs" (
  "Id", "CompanyId", "Title", "Description", "Requirements", "Location",
  "JobType", "WorkMode", "SalaryRange", "ExternalId", "SourceUrl", "Source",
  "Status", "RelevanceScore", "CreatedAt", "UpdatedAt"
)
SELECT 
  gen_random_uuid(),
  c."Id",
  'Senior .NET Backend Engineer',
  'We are looking for an experienced .NET developer to join our team. You will work on building scalable microservices using C#, .NET 8, PostgreSQL, and Docker.',
  '5+ years of experience with .NET and C#. Experience with PostgreSQL and Entity Framework Core. Knowledge of Docker and Kubernetes.',
  'Remote - Worldwide',
  'FullTime',
  'Remote',
  '$120,000 - $160,000',
  'demo-dotnet-001',
  'https://example.com/job/1',
  'demo',
  'Active',
  85.5,
  NOW(),
  NOW()
FROM "Companies" c WHERE c."Name" = 'TechCorp Solutions';

INSERT INTO "Jobs" (
  "Id", "CompanyId", "Title", "Description", "Location",
  "JobType", "WorkMode", "SalaryRange", "ExternalId", "SourceUrl", "Source",
  "Status", "RelevanceScore", "CreatedAt", "UpdatedAt"
)
SELECT 
  gen_random_uuid(),
  c."Id",
  'Full Stack Developer',
  'Join our team to build modern web applications using React and Node.js.',
  'New York, NY',
  'FullTime',
  'Hybrid',
  '$90,000 - $130,000',
  'demo-fullstack-002',
  'https://example.com/job/2',
  'demo',
  'Active',
  72.0,
  NOW(),
  NOW()
FROM "Companies" c WHERE c."Name" = 'StartupXYZ';

INSERT INTO "Jobs" (
  "Id", "CompanyId", "Title", "Description", "Location",
  "JobType", "WorkMode", "SalaryRange", "ExternalId", "SourceUrl", "Source",
  "Status", "RelevanceScore", "CreatedAt", "UpdatedAt"
)
SELECT 
  gen_random_uuid(),
  c."Id",
  'DevOps Engineer',
  'Work on AWS infrastructure and CI/CD pipelines.',
  'Remote - US Only',
  'Contract',
  'Remote',
  '$80/hour - $120/hour',
  'demo-devops-003',
  'https://example.com/job/3',
  'demo',
  'Active',
  78.5,
  NOW(),
  NOW()
FROM "Companies" c WHERE c."Name" = 'CloudTech Inc';
EOF

echo -e "${GREEN}✅ Test data seeded${NC}"

# Step 4: Verify data
echo ""
echo "✅ Verifying data..."

JOBS_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"Jobs\";")
COMPANIES_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"Companies\";")

echo "  📦 Companies: $COMPANIES_COUNT"
echo "  💼 Jobs: $JOBS_COUNT"

if [ "$JOBS_COUNT" -lt 3 ]; then
  echo -e "${YELLOW}⚠️  Warning: Less than 3 jobs. Demo might look empty.${NC}"
fi

# Step 5: Check if backend is running
echo ""
echo "🔍 Checking backend status..."

if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port $BACKEND_PORT${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is not running${NC}"
    echo "   Start it with: cd backend/src/JobAutomation.WebAPI && dotnet run"
fi

# Step 6: Check if frontend is running
echo ""
echo "🔍 Checking frontend status..."

if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port $FRONTEND_PORT${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is not running${NC}"
    echo "   Start it with: cd frontend && npm run dev"
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ Demo environment ready!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Start Backend:  cd backend/src/JobAutomation.WebAPI && dotnet run"
echo "   2. Start Frontend: cd frontend && npm run dev"
echo "   3. Run Scraper:    cd scraper && npm run dev:once"
echo "   4. Open Browser:   http://localhost:$FRONTEND_PORT"
echo ""
echo "📚 API Documentation: https://localhost:5001/swagger"
echo ""
