# Job Automation System

A job ingestion and tracking pipeline designed to automate the collection, deduplication, scoring, and management of job postings from multiple sources.

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
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Scraper   │────▶│  API POST   │────▶│  Validation │────▶│Deduplication│────▶│   Scoring   │
│  (External) │     │  /ingest    │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │                   │                   │
                                               ▼                   ▼                   ▼
                                          [Reject]            [Skip]             [Persist]
                                          with error          duplicate          with score
```

### Project Structure

```
/job-automation-system
├── /backend          # .NET 8 Web API (Clean Architecture)
│   └── /src
│       ├── JobAutomation.Core           # Entities, Use Cases, Interfaces
│       ├── JobAutomation.Infrastructure # EF Core, Repositories, Services
│       └── JobAutomation.WebAPI         # Controllers, Middleware
├── /frontend         # (In development)
├── /scraper          # (In development)
└── /docs             # Technical documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | .NET 8 |
| **Database** | PostgreSQL |
| **ORM** | Entity Framework Core 8 |
| **Authentication** | JWT Bearer |
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

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, database schema, scoring rules, processing decisions
- **[INGEST_OPTIMIZATION.md](docs/INGEST_OPTIMIZATION.md)** - Scaling strategies, performance benchmarks, future optimizations

---

## Current Status

### Implemented
- Job ingestion pipeline with validation, deduplication, and scoring
- Multi-level deduplication (ExternalId + Source, Normalized URL)
- Batch processing without N+1 queries
- Partial failure handling per item
- Application tracking and status management
- Dashboard metrics
- JWT authentication
- Swagger documentation

### In Development
- Frontend application
- Scraper integrations
- User preferences for personalized scoring
- Background job processing

---

## License

MIT
