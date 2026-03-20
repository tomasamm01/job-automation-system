#!/bin/bash

# Integration Verification Script
# Verifies all components are properly integrated

set -e

echo "🔍 Verifying Job Automation System Integration"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

check_pass() {
    echo -e "  ${GREEN}✅ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "  ${RED}❌ $1${NC}"
    ((FAILED++))
}

check_warn() {
    echo -e "  ${YELLOW}⚠️  $1${NC}"
}

# Phase 1: Environment Setup
echo ""
echo -e "${BLUE}Phase 1: Environment Setup${NC}"
echo "----------------------------"

# Check PostgreSQL
if command -v psql &> /dev/null; then
    check_pass "PostgreSQL client installed"
    
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw jobautomation; then
        check_pass "Database 'jobautomation' exists"
    else
        check_fail "Database 'jobautomation' not found"
    fi
else
    check_fail "PostgreSQL client not found"
fi

# Check .NET
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    check_pass ".NET SDK installed (version $DOTNET_VERSION)"
else
    check_fail ".NET SDK not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed (version $NODE_VERSION)"
else
    check_fail "Node.js not found"
fi

# Phase 2: File Structure
echo ""
echo -e "${BLUE}Phase 2: File Structure${NC}"
echo "------------------------"

# Check backend files
if [ -f "backend/src/JobAutomation.WebAPI/Program.cs" ]; then
    check_pass "Backend project structure correct"
else
    check_fail "Backend project structure incorrect"
fi

# Check scraper files
if [ -f "scraper/src/index.ts" ]; then
    check_pass "Scraper project structure correct"
else
    check_fail "Scraper project structure incorrect"
fi

if [ -f "scraper/src/adapters/backend-adapter.ts" ]; then
    check_pass "Backend adapter exists"
else
    check_fail "Backend adapter missing"
fi

# Check frontend files
if [ -f "frontend/src/main.tsx" ]; then
    check_pass "Frontend project structure correct"
else
    check_fail "Frontend project structure incorrect"
fi

# Phase 3: Configuration
echo ""
echo -e "${BLUE}Phase 3: Configuration${NC}"
echo "-----------------------"

# Check backend config
if [ -f "backend/src/JobAutomation.WebAPI/appsettings.json" ]; then
    check_pass "Backend appsettings.json exists"
    
    if grep -q "ConnectionStrings" "backend/src/JobAutomation.WebAPI/appsettings.json"; then
        check_pass "Connection string configured"
    else
        check_warn "Connection string might not be configured"
    fi
else
    check_fail "Backend appsettings.json not found"
fi

# Check scraper config
if [ -f "scraper/.env" ]; then
    check_pass "Scraper .env exists"
    
    if grep -q "BACKEND_URL" "scraper/.env"; then
        check_pass "BACKEND_URL configured"
    else
        check_fail "BACKEND_URL not configured"
    fi
else
    check_warn "Scraper .env not found (use env.template)"
fi

# Check frontend config
if [ -f "frontend/.env" ]; then
    check_pass "Frontend .env exists"
    
    if grep -q "VITE_API_BASE_URL" "frontend/.env"; then
        check_pass "VITE_API_BASE_URL configured"
    else
        check_fail "VITE_API_BASE_URL not configured"
    fi
else
    check_warn "Frontend .env not found"
fi

# Phase 4: Dependencies
echo ""
echo -e "${BLUE}Phase 4: Dependencies${NC}"
echo "----------------------"

# Check backend dependencies
if [ -f "backend/JobAutomation.sln" ]; then
    cd backend
    if dotnet restore > /dev/null 2>&1; then
        check_pass "Backend dependencies restored"
    else
        check_fail "Backend dependencies failed to restore"
    fi
    cd ..
fi

# Check scraper dependencies
if [ -d "scraper/node_modules" ]; then
    check_pass "Scraper dependencies installed"
else
    check_warn "Scraper dependencies not installed (run npm install)"
fi

# Check frontend dependencies
if [ -d "frontend/node_modules" ]; then
    check_pass "Frontend dependencies installed"
else
    check_warn "Frontend dependencies not installed (run npm install)"
fi

# Phase 5: Build Verification
echo ""
echo -e "${BLUE}Phase 5: Build Verification${NC}"
echo "----------------------------"

# Build backend
echo "  Building backend..."
cd backend
if dotnet build > /dev/null 2>&1; then
    check_pass "Backend builds successfully"
else
    check_fail "Backend build failed"
fi
cd ..

# Build scraper
echo "  Building scraper..."
cd scraper
if [ -d "node_modules" ]; then
    if npm run build > /dev/null 2>&1; then
        check_pass "Scraper builds successfully"
    else
        check_warn "Scraper build failed (might be expected if no build script)"
    fi
fi
cd ..

# Build frontend
echo "  Building frontend..."
cd frontend
if [ -d "node_modules" ]; then
    if npm run build > /dev/null 2>&1; then
        check_pass "Frontend builds successfully"
    else
        check_fail "Frontend build failed"
    fi
fi
cd ..

# Phase 6: Documentation
echo ""
echo -e "${BLUE}Phase 6: Documentation${NC}"
echo "-----------------------"

DOCS=(
    "README.md"
    "QUICK_START.md"
    "INTEGRATION_CHECKLIST.md"
    "docs/END_TO_END_INTEGRATION.md"
    "docs/ARCHITECTURE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc not found"
    fi
done

# Phase 7: Scripts
echo ""
echo -e "${BLUE}Phase 7: Scripts${NC}"
echo "-----------------"

SCRIPTS=(
    "scripts/prepare-demo.sh"
    "scripts/e2e-test.sh"
    "scripts/start-all.sh"
    "scripts/stop-all.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        check_pass "$script exists"
        
        if [ -x "$script" ]; then
            check_pass "$script is executable"
        else
            check_warn "$script not executable (run: chmod +x $script)"
        fi
    else
        check_fail "$script not found"
    fi
done

# Summary
echo ""
echo "=============================================="
echo -e "${BLUE}Verification Summary${NC}"
echo "=============================================="
echo ""
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! System is ready for integration.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start services: ./scripts/start-all.sh"
    echo "  2. Prepare demo: ./scripts/prepare-demo.sh"
    echo "  3. Run E2E test: ./scripts/e2e-test.sh"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Install missing dependencies: npm install"
    echo "  - Create .env files from templates"
    echo "  - Run database migrations: dotnet ef database update"
    echo "  - Make scripts executable: chmod +x scripts/*.sh"
    exit 1
fi
