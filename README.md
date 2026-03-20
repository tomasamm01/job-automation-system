# Job Automation System

[![Backend CI](https://github.com/tomasamm01/job-automation-system/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/tomasamm01/job-automation-system/actions/workflows/backend-ci.yml)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A **complete end-to-end job automation system** that scrapes, processes, and manages job postings from multiple sources. Includes scraper engine (Node.js), backend API (.NET 8), and frontend application (React).

## Why This Project Matters

Job seekers often face a fragmented experience: manually browsing multiple job boards, tracking applications in spreadsheets, and losing track of which positions they've already seen. Recruiters and scrapers generate thousands of job postings daily, many of which are duplicates or low-quality matches.

**This system solves the data pipeline problem**, not just the UI problem. It provides:

- **Reliable ingestion** from any scraper with consistent validation
- **Multi-level deduplication** to prevent the same job from appearing twice
- **Automated relevance scoring** to surface the best matches first
- **Partial failure handling** so one bad record doesn't break an entire batch
- **Application tracking** to manage the job search lifecycle

The focus is on **data quality and pipeline reliability**, not just displaying jobs.

---

## System Architecture

```
┌──────────────┐
│   SCRAPER    │  Node.js + TypeScript
│  (Scheduled) │  Fetches from RemoteOK, LinkedIn, etc.
└──────┬───────┘
       │ POST /api/jobs/ingest (batches of 50)
       ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND (.NET 8)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Validation │─▶│Deduplication│─▶│  Scoring   │        │
│  └────────────┘  └────────────┘  └──────┬─────┘        │
│                                          │               │
│                                          ▼               │
│                                   ┌────────────┐        │
│                                   │ PostgreSQL │        │
│                                   └────────────┘        │
└──────────────────────────────────────┬───────────────────┘
                                       │ GET /api/jobs
                                       ▼
                              ┌───────────────────┐
                              │   FRONTEND        │  React + TypeScript
                              │   (React Query)   │  TailwindCSS + shadcn/ui
                              └───────────────────┘
```

### Project Structure

```
/job-automation-system
├── /backend          # .NET 8 Web API (Clean Architecture)
│   └── /src
│       ├── JobAutomation.Core           # Entities, Use Cases, Interfaces
│       ├── JobAutomation.Infrastructure # EF Core, Repositories, Services
│       └── JobAutomation.WebAPI         # Controllers, Middleware
├── /frontend         # React + TypeScript (TailwindCSS + shadcn/ui)
│   └── /src
│       ├── /components  # Reusable UI components
│       ├── /pages       # Page components
│       ├── /services    # API client
│       └── /types       # TypeScript types
├── /scraper          # Node.js + TypeScript (Modular scraper engine)
│   └── /src
│       ├── /adapters    # Backend DTO adapters
│       ├── /sources     # Source-specific scrapers (RemoteOK, LinkedIn)
│       ├── /services    # Orchestrator, Scheduler, Backend service
│       └── /normalizers # Data normalization
├── /scripts          # Automation scripts (demo, testing, deployment)
└── /docs             # Technical documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | .NET 8, ASP.NET Core, Entity Framework Core |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| **Scraper** | Node.js, TypeScript, Axios, Cheerio |
| **Database** | PostgreSQL 14+ |
| **Authentication** | JWT Bearer (ready) |
| **API Documentation** | Swagger/OpenAPI |

---

## Ingestion Pipeline

The core of this system is the **job ingestion pipeline**, designed for batch processing with per-item error handling.

### Pipeline Stages

#### 1. Validation (Synchronous)
Every job in the batch is validated in-memory before any database operations:

- **Required fields**: Title, Source, Company.Name
- **Format validation**: URL format, string length limits
- **Sanitization**: Trimming, URL normalization

Invalid items are rejected with specific error messages; valid items proceed.

#### 2. Deduplication (Batch Query)
Instead of N queries for N jobs, the pipeline uses **batch lookups**:

```
Level 1: ExternalId + Source  →  Single batch query
Level 2: Normalized URL       →  Single batch query
```

**URL Normalization** removes tracking parameters and standardizes format:
```
https://example.com/job/123?utm_source=linkedin&ref=abc
  → example.com/job/123
```

Duplicates are identified in-memory using HashSet lookups after the batch queries.

#### 3. Scoring (Synchronous)
Each new job receives a relevance score (0-100) based on configurable rules:
- Completeness of job data
- Keyword matching
- Work mode preferences
- Salary range alignment

Scoring is synchronous because it's fast (<5ms per job) and the score is needed immediately for sorting.

#### 4. Persistence (Batch)
Non-duplicate jobs are persisted in a single transaction:
- Companies are preloaded/cached to avoid N+1 queries
- Jobs are created with their calculated scores
- Metrics are recorded for monitoring

### Partial Failure Handling

The pipeline processes each item independently. If job #47 in a batch of 100 fails, the other 99 still succeed. The response includes:

```json
{
  "success": true,
  "data": {
    "processed": 100,
    "created": 95,
    "duplicates": 4,
    "failed": 1,
    "createdIds": ["..."],
    "errors": [
      { "index": 47, "externalId": "xyz", "error": "Invalid URL format" }
    ]
  }
}
```

---

## API Endpoints

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs/ingest` | Ingest batch of jobs (max 100) |
| `GET` | `/api/jobs` | List jobs with filters |
| `GET` | `/api/jobs/{id}` | Get job details |

**Query Parameters for GET /api/jobs:**
- `keyword` - Search in title/description
- `jobType` - Filter by job type
- `workMode` - Filter by work mode (Remote, Hybrid, OnSite)
- `location` - Filter by location
- `status` - Filter by status (Active, Expired)
- `minRelevanceScore` - Minimum score threshold
- `page`, `pageSize` - Pagination

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/applications` | Submit application |
| `GET` | `/api/applications` | List applications |
| `GET` | `/api/applications/{id}` | Get application details |
| `PATCH` | `/api/applications/{id}/status` | Update application status |

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/metrics/dashboard` | Get dashboard metrics |

---

## 🚀 Quick Start

**Get the entire system running in 5 minutes!**

See **[QUICK_START.md](QUICK_START.md)** for detailed setup instructions.

### TL;DR

```bash
# 1. Setup database
psql -U postgres -c "CREATE DATABASE jobautomation;"
cd backend
dotnet ef database update --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI

# 2. Configure environment
cd ../scraper && cp env.template .env
cd ../frontend && cp .env.example .env

# 3. Install dependencies
cd ../scraper && npm install
cd ../frontend && npm install

# 4. Start everything (3 terminals)
cd backend/src/JobAutomation.WebAPI && dotnet run  # Terminal 1
cd frontend && npm run dev                          # Terminal 2
cd scraper && npm run dev                           # Terminal 3
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger: https://localhost:5001/swagger

---

## Running the Backend

### Prerequisites

- .NET 8 SDK
- PostgreSQL 14+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/job-automation-system.git
   cd job-automation-system/backend
   ```

2. **Configure the database connection**
   
   Update `src/JobAutomation.WebAPI/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=jobautomation;Username=postgres;Password=yourpassword"
     }
   }
   ```

3. **Apply migrations**
   ```bash
   dotnet ef database update --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI
   ```

4. **Run the API**
   ```bash
   dotnet run --project src/JobAutomation.WebAPI
   ```

5. **Access Swagger UI**
   
   Navigate to `https://localhost:5001/swagger` (or the configured port)

---

## Technical Decisions

### Why Synchronous Processing?

All pipeline stages run synchronously because:
- **Validation**: Fast (<10ms), provides immediate feedback
- **Deduplication**: Required before persistence to maintain data integrity
- **Scoring**: Simple calculation (<5ms), needed for immediate sorting
- **Persistence**: Transactional, caller needs confirmation

Asynchronous processing is reserved for future features like re-scoring, cleanup jobs, and notifications.

### Why Batch Deduplication?

Instead of checking each job individually (N queries), the pipeline:
1. Collects all ExternalIds and URLs from the batch
2. Executes 2 batch queries to find existing matches
3. Filters duplicates in-memory using HashSet

**Result**: O(n) + 2 SQL queries instead of O(n) SQL queries.

### Why URL Normalization?

Job boards often append tracking parameters:
```
?utm_source=linkedin&ref=campaign123&tracking_id=abc
```

Normalizing URLs ensures the same job posted through different campaigns is correctly identified as a duplicate.

### Why Per-Item Error Handling?

In production, scrapers send imperfect data. One malformed record shouldn't fail an entire batch of 100 jobs. Each item is processed independently, and the response clearly indicates what succeeded and what failed.

---

## Documentation

Detailed technical documentation is available in `/docs`:

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | **Get started in 5 minutes** |
| **[END_TO_END_INTEGRATION.md](docs/END_TO_END_INTEGRATION.md)** | **Complete E2E integration guide** |
| **[INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)** | **Production readiness checklist** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, database schema, scoring rules |
| [INGEST_OPTIMIZATION.md](docs/INGEST_OPTIMIZATION.md) | Scaling strategies, performance benchmarks |
| [guides/DEVELOPMENT.md](docs/guides/DEVELOPMENT.md) | Local development setup and workflows |
| [decisions/](docs/decisions/) | Architecture Decision Records (ADRs) |

### Component Documentation

- **Scraper**: See [scraper/README.md](scraper/README.md)
- **Frontend**: See [frontend/README.md](frontend/README.md)
- **Backend**: See [backend/README.md](backend/README.md)

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development workflow
- Commit conventions (Conventional Commits)
- Branch naming
- Pull request process

---

## Current Status

### ✅ Completed (Production Ready)
- **Backend API** (.NET 8)
  - Job ingestion pipeline with validation, deduplication, and scoring
  - Multi-level deduplication (ExternalId + Source, Normalized URL)
  - Batch processing without N+1 queries
  - Partial failure handling per item
  - Application tracking and status management
  - Dashboard metrics
  - Swagger documentation

- **Scraper Engine** (Node.js)
  - Modular architecture with source isolation
  - RemoteOK integration (working)
  - LinkedIn template (ready to implement)
  - GetOnBoard template (ready to implement)
  - Backend adapter for DTO transformation
  - Rate limiting and retry mechanisms
  - Scheduled execution with cron

- **Frontend Application** (React)
  - Job listing with filters and pagination
  - Job details view
  - Application submission
  - Application tracking
  - Responsive design with TailwindCSS

- **End-to-End Integration**
  - Complete data flow: Scraper → Backend → Frontend
  - API contracts documented
  - Testing strategy (unit, integration, E2E)
  - Demo scripts and automation

### 🚧 In Development
- User authentication (JWT ready, UI pending)
- User preferences for personalized scoring
- Background job processing (re-scoring, cleanup)
- Email notifications
- Additional scraper sources

---

## 🧪 Testing

```bash
# Backend tests
cd backend
dotnet test

# Scraper tests
cd scraper
npm test

# Frontend tests
cd frontend
npm test

# End-to-end test
./scripts/e2e-test.sh
```

---

## 📦 Deployment

See deployment guides:
- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)
- Scraper: [scraper/README.md](scraper/README.md)

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development workflow
- Commit conventions (Conventional Commits)
- Branch naming
- Pull request process

---

## 📄 License

MIT
