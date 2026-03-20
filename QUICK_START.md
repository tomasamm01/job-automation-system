# Quick Start Guide
## Job Automation System - End-to-End Setup

Get the entire system running in **5 minutes**.

---

## Prerequisites

- **PostgreSQL 14+** (running on localhost:5432)
- **.NET 8 SDK**
- **Node.js 18+**
- **Git**

---

## 1. Clone & Setup Database

```bash
# Clone repository
git clone https://github.com/your-username/job-automation-system.git
cd job-automation-system

# Create database
psql -U postgres -c "CREATE DATABASE jobautomation;"

# Run migrations
cd backend
dotnet ef database update --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI
cd ..
```

---

## 2. Configure Environment

### Backend
```bash
# Edit backend/src/JobAutomation.WebAPI/appsettings.json
# Update connection string if needed:
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=jobautomation;Username=postgres;Password=yourpassword"
  }
}
```

### Scraper
```bash
cd scraper
cp env.template .env

# Edit .env
BACKEND_URL=http://localhost:5000
REMOTEOK_ENABLED=true
REMOTEOK_SCHEDULE=*/30 * * * *
```

### Frontend
```bash
cd frontend
cp .env.example .env

# Edit .env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 3. Install Dependencies

```bash
# Backend (no additional install needed, restored on run)

# Scraper
cd scraper
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

---

## 4. Start Everything

### Option A: Manual (3 terminals)

**Terminal 1 - Backend:**
```bash
cd backend/src/JobAutomation.WebAPI
dotnet run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Scraper:**
```bash
cd scraper
npm run dev
```

### Option B: Automated (Linux/Mac)

```bash
chmod +x scripts/*.sh
./scripts/start-all.sh
```

---

## 5. Seed Demo Data

```bash
# Run demo preparation script
./scripts/prepare-demo.sh

# Or manually seed
cd scraper
npm run dev:once
```

---

## 6. Access the System

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main UI |
| **Backend API** | http://localhost:5000 | REST API |
| **Swagger** | https://localhost:5001/swagger | API Documentation |

---

## 7. Verify Everything Works

### Test Backend
```bash
curl http://localhost:5000/health
# Expected: "Healthy"

curl http://localhost:5000/api/jobs | jq '.data.totalCount'
# Expected: Number of jobs
```

### Test Scraper → Backend
```bash
cd scraper
npm run dev:once

# Check logs for:
# ✅ "Found X jobs"
# ✅ "Sending X jobs in Y batches"
# ✅ "Batch 1/Y sent successfully"
```

### Test Frontend
1. Open http://localhost:5173
2. Navigate to "Jobs" page
3. Verify jobs are displayed
4. Apply filters (Work Mode, Job Type)
5. Click on a job to see details

---

## Common Issues

### Backend won't start
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string in appsettings.json
# Verify database exists
psql -U postgres -l | grep jobautomation
```

### Scraper can't connect to backend
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check scraper .env file
cat scraper/.env | grep BACKEND_URL
```

### Frontend shows no jobs
```bash
# Check backend has jobs
curl http://localhost:5000/api/jobs | jq '.data.totalCount'

# Check frontend .env
cat frontend/.env | grep VITE_API_BASE_URL

# Check browser console for CORS errors
```

### Port already in use
```bash
# Find process using port 5000
lsof -i :5000
# or on Windows
netstat -ano | findstr :5000

# Kill the process or change port in appsettings.json
```

---

## Next Steps

1. **Explore the API**: Open https://localhost:5001/swagger
2. **Add more sources**: See `scraper/README.md`
3. **Customize scoring**: Edit scoring rules in backend
4. **Run tests**: `dotnet test` (backend), `npm test` (frontend/scraper)

---

## Development Workflow

### Make changes to backend
```bash
cd backend/src/JobAutomation.WebAPI
# Edit code
dotnet run  # Hot reload enabled
```

### Make changes to frontend
```bash
cd frontend
# Edit code
# Vite will auto-reload
```

### Make changes to scraper
```bash
cd scraper
# Edit code
npm run dev  # tsx watch enabled
```

---

## Production Deployment

See `docs/DEPLOYMENT.md` for production setup instructions.

---

## Architecture Overview

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Scraper  │─────▶│ Backend  │◀─────│ Frontend │
│ Node.js  │      │  .NET 8  │      │  React   │
└──────────┘      └────┬─────┘      └──────────┘
                       │
                       ▼
                  ┌──────────┐
                  │PostgreSQL│
                  └──────────┘
```

**Data Flow:**
1. Scraper fetches jobs from external sources (RemoteOK, LinkedIn, etc.)
2. Scraper sends jobs to Backend via POST /api/jobs/ingest
3. Backend validates, deduplicates, scores, and stores jobs
4. Frontend fetches jobs via GET /api/jobs
5. User applies to jobs via POST /api/applications

---

## Documentation

- **Architecture**: `docs/ARCHITECTURE.md`
- **API Contracts**: `docs/END_TO_END_INTEGRATION.md`
- **Scraper Guide**: `scraper/README.md`
- **Frontend Guide**: `frontend/README.md`

---

## Support

- **Issues**: https://github.com/your-username/job-automation-system/issues
- **Discussions**: https://github.com/your-username/job-automation-system/discussions

---

**Happy job hunting! 🚀**
