# End-to-End Integration Strategy
## Job Automation System - Arquitectura de Software Senior

**Fecha**: Marzo 2026  
**Objetivo**: Conectar Scraper (Node.js) → Backend (.NET 8) → Frontend (React) como producto funcional

---

## 1. Flujo Completo de Datos

### 1.1 Diagrama de Arquitectura End-to-End

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO COMPLETO DEL SISTEMA                           │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │   SCRAPER    │  Node.js + TypeScript
   │  (Scheduled) │  
   └──────┬───────┘
          │ 1. Fetch jobs from external sources
          │    (RemoteOK, LinkedIn, GetOnBoard)
          │
          ▼
   ┌──────────────┐
   │ Normalizer   │  Transform to standard format
   └──────┬───────┘
          │ 2. POST /api/jobs/ingest
          │    Batch: max 100 jobs
          │    Format: CreateJobDto[]
          │
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
                                          │
                                          │ 3. GET /api/jobs
                                          │    Filters, pagination
                                          │    Response: PagedResult<JobListDto>
                                          │
                                          ▼
                              ┌───────────────────┐
                              │   FRONTEND        │  React + TypeScript
                              │   (React Query)   │  TailwindCSS + shadcn/ui
                              └───────────────────┘
                                          │
                                          │ 4. User applies to job
                                          │    POST /api/applications
                                          │
                                          ▼
                              ┌───────────────────┐
                              │  Application      │
                              │  Tracking         │
                              └───────────────────┘
```

### 1.2 Flujo de Datos Detallado

#### **Fase 1: Scraping → Backend**

```typescript
// SCRAPER: src/services/orchestrator.ts
async runSource(source: IJobSource) {
  // 1. Fetch raw jobs from external source
  const rawJobs = await source.fetchJobs();
  
  // 2. Normalize to standard format
  const normalized = rawJobs.map(job => normalizer.normalize(job));
  
  // 3. Send to backend in batches
  await backendService.sendJobs(normalized);
}

// SCRAPER OUTPUT FORMAT (JobNormalized)
{
  externalId: "remoteok-123456",
  source: "remoteok",
  title: "Senior Backend Engineer",
  company: "TechCorp",
  location: "Remote - Worldwide",
  url: "https://remoteok.com/remote-jobs/123456",
  description: "We are looking for...",
  salaryMin: 100000,
  salaryMax: 150000,
  workMode: "Remote",      // Remote | Hybrid | OnSite
  jobType: "FullTime"      // FullTime | PartTime | Contract | Freelance
}
```

#### **Fase 2: Backend Processing**

```csharp
// BACKEND: Controllers/JobsController.cs
[HttpPost("ingest")]
public async Task<ActionResult<ApiResponse<IngestResultDto>>> IngestJobs(
    [FromBody] List<CreateJobDto> jobs)
{
    // 1. Validation (sync)
    //    - Required fields: Title, Source, Company.Name
    //    - Format validation: URL, string lengths
    
    // 2. Deduplication (batch query)
    //    - Level 1: ExternalId + Source
    //    - Level 2: Normalized URL
    
    // 3. Scoring (sync)
    //    - Completeness: 20%
    //    - Keywords: 40%
    //    - WorkMode: 20%
    //    - Salary: 20%
    
    // 4. Persistence (batch transaction)
    var result = await _ingestJobsUseCase.ExecuteAsync(jobs);
    
    return Ok(ApiResponse<IngestResultDto>.Ok(result));
}

// BACKEND RESPONSE
{
  "success": true,
  "data": {
    "processed": 50,
    "created": 45,
    "duplicates": 5,
    "failed": 0,
    "createdIds": ["guid1", "guid2", ...],
    "errors": []
  },
  "message": "45 jobs ingested successfully"
}
```

#### **Fase 3: Frontend Consumption**

```typescript
// FRONTEND: services/api.ts
export const jobsApi = {
  getJobs: async (filters: JobFilters): Promise<PagedResult<JobListItem>> => {
    const response = await api.get<ApiResponse<PagedResult<JobListItem>>>(
      `/jobs?${buildQueryParams(filters)}`
    );
    return response.data.data;
  },
  
  getJob: async (id: string): Promise<Job> => {
    const response = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data.data;
  }
};

// FRONTEND DISPLAY
// pages/JobsPage.tsx
const { data, isLoading } = useQuery({
  queryKey: ['jobs', filters],
  queryFn: () => jobsApi.getJobs(filters)
});

// Render jobs with filters, pagination, and relevance score
```

---

## 2. Contratos API Claros

### 2.1 API Contract: Scraper → Backend

#### **Endpoint**: `POST /api/jobs/ingest`

**Request Body**:
```json
[
  {
    "title": "Senior Backend Engineer",
    "description": "We are looking for an experienced backend engineer...",
    "requirements": "5+ years of experience with .NET, C#, PostgreSQL...",
    "location": "Remote - Worldwide",
    "jobType": "FullTime",
    "workMode": "Remote",
    "salaryRange": "$100,000 - $150,000",
    "externalId": "remoteok-123456",
    "sourceUrl": "https://remoteok.com/remote-jobs/123456",
    "source": "remoteok",
    "expiresAt": "2026-04-20T00:00:00Z",
    "company": {
      "name": "TechCorp",
      "website": "https://techcorp.com",
      "industry": "Technology",
      "location": "San Francisco, CA",
      "logoUrl": "https://logo.clearbit.com/techcorp.com"
    }
  }
]
```

**Response**:
```json
{
  "success": true,
  "data": {
    "processed": 1,
    "created": 1,
    "duplicates": 0,
    "failed": 0,
    "createdIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    "errors": []
  },
  "message": "1 jobs ingested successfully"
}
```

**Error Response** (Partial Failure):
```json
{
  "success": true,
  "data": {
    "processed": 3,
    "created": 2,
    "duplicates": 0,
    "failed": 1,
    "createdIds": ["guid1", "guid2"],
    "errors": [
      {
        "index": 2,
        "externalId": "invalid-job",
        "error": "Title is required"
      }
    ]
  },
  "message": "2 jobs created, 0 duplicates, 1 failed"
}
```

### 2.2 API Contract: Backend → Frontend

#### **Endpoint**: `GET /api/jobs`

**Query Parameters**:
```
keyword: string (optional)
jobType: FullTime | PartTime | Contract | Freelance (optional)
workMode: Remote | Hybrid | OnSite (optional)
location: string (optional)
status: Active | Expired (optional)
minRelevanceScore: number (0-100, optional)
page: number (default: 1)
pageSize: number (default: 20, max: 100)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "title": "Senior Backend Engineer",
        "location": "Remote - Worldwide",
        "jobType": "FullTime",
        "workMode": "Remote",
        "salaryRange": "$100,000 - $150,000",
        "status": "Active",
        "relevanceScore": 85.5,
        "createdAt": "2026-03-20T10:30:00Z",
        "companyName": "TechCorp"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

#### **Endpoint**: `GET /api/jobs/{id}`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Senior Backend Engineer",
    "description": "We are looking for an experienced backend engineer...",
    "requirements": "5+ years of experience with .NET, C#, PostgreSQL...",
    "location": "Remote - Worldwide",
    "jobType": "FullTime",
    "workMode": "Remote",
    "salaryRange": "$100,000 - $150,000",
    "source": "remoteok",
    "sourceUrl": "https://remoteok.com/remote-jobs/123456",
    "status": "Active",
    "relevanceScore": 85.5,
    "createdAt": "2026-03-20T10:30:00Z",
    "expiresAt": "2026-04-20T00:00:00Z",
    "company": {
      "id": "company-guid",
      "name": "TechCorp",
      "website": "https://techcorp.com",
      "industry": "Technology",
      "location": "San Francisco, CA",
      "logoUrl": "https://logo.clearbit.com/techcorp.com"
    }
  }
}
```

#### **Endpoint**: `POST /api/applications`

**Request**:
```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "coverLetter": "I am excited to apply for this position...",
  "resumeUrl": "https://storage.example.com/resumes/john-doe.pdf",
  "notes": "Applied through company website"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "application-guid",
    "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "Applied",
    "appliedAt": "2026-03-20T15:45:00Z",
    "coverLetter": "I am excited to apply...",
    "resumeUrl": "https://storage.example.com/resumes/john-doe.pdf",
    "notes": "Applied through company website"
  }
}
```

### 2.3 Mapeo de Tipos: Scraper ↔ Backend

| Scraper (TypeScript) | Backend (.NET) | Notas |
|---------------------|----------------|-------|
| `JobNormalized.externalId` | `CreateJobDto.ExternalId` | Opcional, para deduplicación |
| `JobNormalized.source` | `CreateJobDto.Source` | **Requerido**: "remoteok", "linkedin", etc. |
| `JobNormalized.title` | `CreateJobDto.Title` | **Requerido**, max 500 chars |
| `JobNormalized.company` | `CreateCompanyDto.Name` | **Requerido**, max 300 chars |
| `JobNormalized.location` | `CreateJobDto.Location` | Opcional, max 200 chars |
| `JobNormalized.url` | `CreateJobDto.SourceUrl` | Opcional, será normalizada |
| `JobNormalized.description` | `CreateJobDto.Description` | Opcional, text |
| `JobNormalized.salaryMin/Max` | `CreateJobDto.SalaryRange` | Convertir a string: "$100k - $150k" |
| `JobNormalized.workMode` | `CreateJobDto.WorkMode` | Enum: Remote, Hybrid, OnSite |
| `JobNormalized.jobType` | `CreateJobDto.JobType` | Enum: FullTime, PartTime, Contract, Freelance |

**Transformación en Scraper**:
```typescript
// scraper/src/normalizers/base-normalizer.ts
function toBackendFormat(job: JobNormalized): CreateJobDto {
  return {
    title: job.title,
    description: job.description,
    requirements: null, // Si el scraper no lo extrae
    location: job.location,
    jobType: mapJobType(job.jobType),
    workMode: mapWorkMode(job.workMode),
    salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax),
    externalId: job.externalId,
    sourceUrl: job.url,
    source: job.source,
    expiresAt: null, // Opcional
    company: {
      name: job.company,
      website: null,
      industry: null,
      location: null,
      logoUrl: null
    }
  };
}

function mapWorkMode(mode: string): string {
  const mapping: Record<string, string> = {
    'remote': 'Remote',
    'hybrid': 'Hybrid',
    'onsite': 'OnSite',
    'on-site': 'OnSite'
  };
  return mapping[mode.toLowerCase()] || 'Remote';
}

function mapJobType(type: string): string {
  const mapping: Record<string, string> = {
    'full-time': 'FullTime',
    'fulltime': 'FullTime',
    'part-time': 'PartTime',
    'parttime': 'PartTime',
    'contract': 'Contract',
    'freelance': 'Freelance'
  };
  return mapping[type.toLowerCase()] || 'FullTime';
}

function formatSalaryRange(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return null;
}
```

---

## 3. Estrategia de Testing End-to-End

### 3.1 Niveles de Testing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PIRÁMIDE DE TESTING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                            ┌─────────┐                                      │
│                            │   E2E   │  ← Flujo completo (5%)               │
│                            └─────────┘                                      │
│                        ┌─────────────────┐                                  │
│                        │  Integration    │  ← API + DB (20%)                │
│                        └─────────────────┘                                  │
│                   ┌──────────────────────────┐                              │
│                   │      Unit Tests          │  ← Lógica (75%)              │
│                   └──────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Unit Tests

#### **Backend (.NET)**

```csharp
// tests/JobAutomation.Core.Tests/Services/ScoringServiceTests.cs
public class ScoringServiceTests
{
    [Fact]
    public async Task CalculateScore_WithCompleteJob_ReturnsHighScore()
    {
        // Arrange
        var job = new Job
        {
            Title = "Senior Backend Engineer",
            Description = new string('x', 200),
            Requirements = "5+ years .NET",
            SalaryRange = "$100k - $150k",
            Location = "Remote",
            Company = new Company { Website = "https://example.com" }
        };
        
        var scoringService = new ScoringService();
        
        // Act
        var score = await scoringService.CalculateScoreAsync(job);
        
        // Assert
        Assert.InRange(score, 70, 100);
    }
}

// tests/JobAutomation.Core.Tests/Services/UrlNormalizerTests.cs
public class UrlNormalizerTests
{
    [Theory]
    [InlineData("https://example.com/job/123?utm_source=linkedin", "example.com/job/123")]
    [InlineData("https://example.com/job/123/", "example.com/job/123")]
    public void Normalize_RemovesTrackingParams(string input, string expected)
    {
        var result = UrlNormalizer.Normalize(input);
        Assert.Equal(expected, result);
    }
}
```

#### **Scraper (Node.js)**

```typescript
// scraper/tests/normalizers/base-normalizer.test.ts
describe('BaseNormalizer', () => {
  it('should normalize work mode correctly', () => {
    const normalizer = new BaseNormalizer();
    
    expect(normalizer.normalizeWorkMode('remote')).toBe('Remote');
    expect(normalizer.normalizeWorkMode('HYBRID')).toBe('Hybrid');
    expect(normalizer.normalizeWorkMode('on-site')).toBe('OnSite');
  });
  
  it('should format salary range', () => {
    const normalizer = new BaseNormalizer();
    
    expect(normalizer.formatSalaryRange(100000, 150000))
      .toBe('$100,000 - $150,000');
  });
});
```

### 3.3 Integration Tests

#### **Backend API Tests**

```csharp
// tests/JobAutomation.IntegrationTests/Controllers/JobsControllerTests.cs
public class JobsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    
    [Fact]
    public async Task IngestJobs_WithValidData_ReturnsCreatedJobs()
    {
        // Arrange
        var jobs = new List<CreateJobDto>
        {
            new CreateJobDto(
                Title: "Backend Engineer",
                Description: "Test job",
                Requirements: null,
                Location: "Remote",
                JobType: JobType.FullTime,
                WorkMode: WorkMode.Remote,
                SalaryRange: "$100k - $150k",
                ExternalId: "test-123",
                SourceUrl: "https://example.com/job/123",
                Source: "test",
                ExpiresAt: null,
                Company: new CreateCompanyDto("TestCorp")
            )
        };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/jobs/ingest", jobs);
        
        // Assert
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<IngestResultDto>>();
        Assert.Equal(1, result.Data.Created);
        Assert.Equal(0, result.Data.Failed);
    }
    
    [Fact]
    public async Task IngestJobs_WithDuplicate_SkipsDuplicate()
    {
        // Arrange: Insert job first
        await SeedJobAsync("test-duplicate", "test");
        
        var jobs = new List<CreateJobDto>
        {
            new CreateJobDto(
                Title: "Duplicate Job",
                ExternalId: "test-duplicate",
                Source: "test",
                // ... other fields
            )
        };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/jobs/ingest", jobs);
        
        // Assert
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<IngestResultDto>>();
        Assert.Equal(0, result.Data.Created);
        Assert.Equal(1, result.Data.Duplicates);
    }
}
```

### 3.4 End-to-End Tests

#### **Playwright Test (Frontend → Backend)**

```typescript
// frontend/e2e/job-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Job Application Flow', () => {
  test('should display jobs from backend', async ({ page }) => {
    // Navigate to jobs page
    await page.goto('http://localhost:5173/jobs');
    
    // Wait for jobs to load
    await page.waitForSelector('[data-testid="job-card"]');
    
    // Verify jobs are displayed
    const jobCards = await page.locator('[data-testid="job-card"]').count();
    expect(jobCards).toBeGreaterThan(0);
    
    // Verify job details
    const firstJob = page.locator('[data-testid="job-card"]').first();
    await expect(firstJob.locator('[data-testid="job-title"]')).toBeVisible();
    await expect(firstJob.locator('[data-testid="company-name"]')).toBeVisible();
    await expect(firstJob.locator('[data-testid="relevance-score"]')).toBeVisible();
  });
  
  test('should filter jobs by work mode', async ({ page }) => {
    await page.goto('http://localhost:5173/jobs');
    
    // Select Remote filter
    await page.selectOption('[data-testid="work-mode-filter"]', 'Remote');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Verify all jobs are remote
    const workModes = await page.locator('[data-testid="work-mode"]').allTextContents();
    expect(workModes.every(mode => mode === 'Remote')).toBeTruthy();
  });
  
  test('should apply to a job', async ({ page }) => {
    await page.goto('http://localhost:5173/jobs');
    
    // Click on first job
    await page.locator('[data-testid="job-card"]').first().click();
    
    // Fill application form
    await page.fill('[data-testid="cover-letter"]', 'I am interested in this position...');
    await page.fill('[data-testid="resume-url"]', 'https://example.com/resume.pdf');
    
    // Submit application
    await page.click('[data-testid="submit-application"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

#### **Full System Test (Scraper → Backend → Frontend)**

```bash
#!/bin/bash
# scripts/e2e-test.sh

echo "🚀 Starting End-to-End Test"

# 1. Start Backend
echo "📦 Starting Backend..."
cd backend/src/JobAutomation.WebAPI
dotnet run &
BACKEND_PID=$!
sleep 5

# 2. Start Frontend
echo "🎨 Starting Frontend..."
cd ../../../frontend
npm run dev &
FRONTEND_PID=$!
sleep 3

# 3. Run Scraper (one-time)
echo "🕷️ Running Scraper..."
cd ../scraper
npm run dev:once

# 4. Wait for data to be ingested
sleep 2

# 5. Verify data in backend
echo "✅ Verifying Backend..."
JOBS_COUNT=$(curl -s http://localhost:5000/api/jobs | jq '.data.totalCount')
echo "Jobs in database: $JOBS_COUNT"

if [ "$JOBS_COUNT" -gt 0 ]; then
  echo "✅ Backend has jobs"
else
  echo "❌ Backend has no jobs"
  exit 1
fi

# 6. Run Frontend E2E tests
echo "🧪 Running Frontend E2E Tests..."
cd ../frontend
npm run test:e2e

# 7. Cleanup
echo "🧹 Cleaning up..."
kill $BACKEND_PID $FRONTEND_PID

echo "✅ End-to-End Test Complete"
```

---

## 4. Datos de Prueba Reales

### 4.1 Seed Data para Testing

```csharp
// backend/tests/JobAutomation.IntegrationTests/SeedData.cs
public static class SeedData
{
    public static List<CreateJobDto> GetTestJobs()
    {
        return new List<CreateJobDto>
        {
            // Job 1: High relevance (Remote, .NET, Senior)
            new CreateJobDto(
                Title: "Senior .NET Backend Engineer",
                Description: "We are looking for an experienced .NET developer to join our team. " +
                            "You will work on building scalable microservices using C#, .NET 8, " +
                            "PostgreSQL, and Docker. Strong knowledge of Clean Architecture required.",
                Requirements: "5+ years of experience with .NET and C#\n" +
                             "Experience with PostgreSQL and Entity Framework Core\n" +
                             "Knowledge of Docker and Kubernetes\n" +
                             "Strong understanding of SOLID principles",
                Location: "Remote - Worldwide",
                JobType: JobType.FullTime,
                WorkMode: WorkMode.Remote,
                SalaryRange: "$120,000 - $160,000",
                ExternalId: "remoteok-senior-dotnet-001",
                SourceUrl: "https://remoteok.com/remote-jobs/123456",
                Source: "remoteok",
                ExpiresAt: DateTime.UtcNow.AddDays(30),
                Company: new CreateCompanyDto(
                    Name: "TechCorp Solutions",
                    Website: "https://techcorp.com",
                    Industry: "Software Development",
                    Location: "San Francisco, CA",
                    LogoUrl: "https://logo.clearbit.com/techcorp.com"
                )
            ),
            
            // Job 2: Medium relevance (Hybrid, Full-stack)
            new CreateJobDto(
                Title: "Full Stack Developer",
                Description: "Join our team to build modern web applications using React and Node.js. " +
                            "Experience with TypeScript and PostgreSQL is a plus.",
                Requirements: "3+ years of experience with React and Node.js\n" +
                             "TypeScript knowledge\n" +
                             "Experience with REST APIs",
                Location: "New York, NY",
                JobType: JobType.FullTime,
                WorkMode: WorkMode.Hybrid,
                SalaryRange: "$90,000 - $130,000",
                ExternalId: "linkedin-fullstack-002",
                SourceUrl: "https://linkedin.com/jobs/view/987654",
                Source: "linkedin",
                ExpiresAt: DateTime.UtcNow.AddDays(45),
                Company: new CreateCompanyDto(
                    Name: "StartupXYZ",
                    Website: "https://startupxyz.com",
                    Industry: "FinTech",
                    Location: "New York, NY"
                )
            ),
            
            // Job 3: Low relevance (OnSite, Junior)
            new CreateJobDto(
                Title: "Junior Frontend Developer",
                Description: "Entry-level position for a frontend developer. " +
                            "Learn React and modern web development practices.",
                Requirements: "1+ year of experience with HTML, CSS, JavaScript\n" +
                             "Basic knowledge of React",
                Location: "Austin, TX",
                JobType: JobType.FullTime,
                WorkMode: WorkMode.OnSite,
                SalaryRange: "$60,000 - $80,000",
                ExternalId: "indeed-junior-003",
                SourceUrl: "https://indeed.com/viewjob?jk=abc123",
                Source: "indeed",
                ExpiresAt: DateTime.UtcNow.AddDays(60),
                Company: new CreateCompanyDto(
                    Name: "Local Agency",
                    Location: "Austin, TX"
                )
            ),
            
            // Job 4: Contract position
            new CreateJobDto(
                Title: "Contract DevOps Engineer",
                Description: "6-month contract for DevOps engineer. " +
                            "Work on AWS infrastructure and CI/CD pipelines.",
                Requirements: "Experience with AWS, Docker, Kubernetes\n" +
                             "CI/CD pipeline setup (GitHub Actions, Jenkins)\n" +
                             "Terraform or CloudFormation",
                Location: "Remote - US Only",
                JobType: JobType.Contract,
                WorkMode: WorkMode.Remote,
                SalaryRange: "$80/hour - $120/hour",
                ExternalId: "upwork-devops-004",
                SourceUrl: "https://upwork.com/jobs/devops-contract",
                Source: "upwork",
                ExpiresAt: DateTime.UtcNow.AddDays(15),
                Company: new CreateCompanyDto(
                    Name: "CloudTech Inc",
                    Website: "https://cloudtech.io",
                    Industry: "Cloud Services"
                )
            )
        };
    }
}
```

### 4.2 Script de Seed para PostgreSQL

```sql
-- scripts/seed-test-data.sql

-- Clear existing data
TRUNCATE TABLE "Applications" CASCADE;
TRUNCATE TABLE "Jobs" CASCADE;
TRUNCATE TABLE "Companies" CASCADE;
TRUNCATE TABLE "Metrics" CASCADE;

-- Insert test companies
INSERT INTO "Companies" ("Id", "Name", "Website", "Industry", "Location", "CreatedAt", "UpdatedAt")
VALUES 
  (gen_random_uuid(), 'TechCorp Solutions', 'https://techcorp.com', 'Software Development', 'San Francisco, CA', NOW(), NOW()),
  (gen_random_uuid(), 'StartupXYZ', 'https://startupxyz.com', 'FinTech', 'New York, NY', NOW(), NOW()),
  (gen_random_uuid(), 'Local Agency', NULL, NULL, 'Austin, TX', NOW(), NOW()),
  (gen_random_uuid(), 'CloudTech Inc', 'https://cloudtech.io', 'Cloud Services', 'Remote', NOW(), NOW());

-- Insert test jobs (use company IDs from above)
INSERT INTO "Jobs" (
  "Id", "CompanyId", "Title", "Description", "Requirements", "Location",
  "JobType", "WorkMode", "SalaryRange", "ExternalId", "SourceUrl", "Source",
  "Status", "RelevanceScore", "CreatedAt", "UpdatedAt"
)
SELECT 
  gen_random_uuid(),
  c."Id",
  'Senior .NET Backend Engineer',
  'We are looking for an experienced .NET developer...',
  '5+ years of experience with .NET and C#...',
  'Remote - Worldwide',
  'FullTime',
  'Remote',
  '$120,000 - $160,000',
  'remoteok-senior-dotnet-001',
  'https://remoteok.com/remote-jobs/123456',
  'remoteok',
  'Active',
  85.5,
  NOW(),
  NOW()
FROM "Companies" c WHERE c."Name" = 'TechCorp Solutions';

-- Add more jobs...
```

### 4.3 Mock Data Generator (Scraper)

```typescript
// scraper/src/utils/mock-data-generator.ts
export class MockDataGenerator {
  static generateJobs(count: number): JobNormalized[] {
    const companies = ['TechCorp', 'StartupXYZ', 'CloudTech', 'DevShop'];
    const locations = ['Remote - Worldwide', 'New York, NY', 'San Francisco, CA', 'Austin, TX'];
    const titles = [
      'Senior Backend Engineer',
      'Full Stack Developer',
      'DevOps Engineer',
      'Frontend Developer',
      'Data Engineer'
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      externalId: `mock-${Date.now()}-${i}`,
      source: 'mock',
      title: titles[i % titles.length],
      company: companies[i % companies.length],
      location: locations[i % locations.length],
      url: `https://example.com/job/${i}`,
      description: `This is a mock job description for testing purposes. Job #${i}.`,
      salaryMin: 80000 + (i * 10000),
      salaryMax: 120000 + (i * 10000),
      workMode: i % 2 === 0 ? 'Remote' : 'Hybrid',
      jobType: 'FullTime'
    }));
  }
}

// Usage for testing
const mockJobs = MockDataGenerator.generateJobs(50);
await backendService.sendJobs(mockJobs);
```

---

## 5. Demo del Sistema Funcionando

### 5.1 Preparación del Demo

#### **Checklist Pre-Demo**

```markdown
## ✅ Pre-Demo Checklist

### Backend
- [ ] PostgreSQL running on localhost:5432
- [ ] Database migrated: `dotnet ef database update`
- [ ] Seed data loaded: `psql -f scripts/seed-test-data.sql`
- [ ] Backend running: `dotnet run` (port 5000)
- [ ] Swagger accessible: https://localhost:5001/swagger

### Scraper
- [ ] Dependencies installed: `npm install`
- [ ] .env configured with BACKEND_URL=http://localhost:5000
- [ ] Test scrape successful: `npm run dev:once`

### Frontend
- [ ] Dependencies installed: `npm install`
- [ ] .env configured with VITE_API_BASE_URL=http://localhost:5000
- [ ] Frontend running: `npm run dev` (port 5173)
- [ ] Can access: http://localhost:5173

### Data Verification
- [ ] At least 20 jobs in database
- [ ] Jobs have relevance scores
- [ ] Companies are linked correctly
- [ ] No duplicate jobs
```

### 5.2 Script de Demo (10 minutos)

#### **Minuto 1-2: Introducción**

```
"Este es un sistema completo de automatización de búsqueda de empleo.
Tiene 3 componentes principales:

1. Scraper (Node.js) - Recolecta jobs de múltiples fuentes
2. Backend (.NET 8) - Procesa, deduplica y puntúa los jobs
3. Frontend (React) - Interfaz para buscar y aplicar a jobs

Vamos a ver el flujo completo en acción."
```

#### **Minuto 3-4: Scraper en Acción**

```bash
# Terminal 1: Mostrar logs del scraper
cd scraper
npm run dev:once

# Observar:
# - "Starting RemoteOK scraping"
# - "Found 150 jobs from RemoteOK"
# - "Sending 150 jobs in 3 batches"
# - "Batch 1/3 sent successfully (50 jobs)"
```

**Explicar**:
- El scraper obtiene jobs de RemoteOK
- Normaliza los datos a formato estándar
- Envía en batches de 50 a la API

#### **Minuto 5-6: Backend Processing**

```bash
# Terminal 2: Mostrar logs del backend
cd backend/src/JobAutomation.WebAPI
dotnet run

# Observar en logs:
# - POST /api/jobs/ingest
# - "Processing 50 jobs"
# - "Created: 45, Duplicates: 5, Failed: 0"
```

**Abrir Swagger**: `https://localhost:5001/swagger`

```
GET /api/jobs?minRelevanceScore=80&workMode=Remote

Respuesta:
- 15 jobs con score > 80
- Todos Remote
- Ordenados por relevanceScore descendente
```

**Explicar**:
- Validación de campos requeridos
- Deduplicación por ExternalId + Source
- Scoring automático (0-100)
- Respuesta con métricas detalladas

#### **Minuto 7-9: Frontend Demo**

**Abrir**: `http://localhost:5173`

1. **Jobs Page**
   - Mostrar lista de jobs con scores
   - Aplicar filtro: Work Mode = "Remote"
   - Aplicar filtro: Min Score = 80
   - Mostrar paginación funcionando

2. **Job Details**
   - Click en un job con score alto
   - Mostrar descripción completa
   - Mostrar información de la empresa
   - Mostrar botón "Apply"

3. **Application Flow**
   - Click "Apply to this Job"
   - Llenar cover letter
   - Agregar URL de resume
   - Submit
   - Mostrar confirmación

4. **Applications Page**
   - Navegar a "My Applications"
   - Mostrar lista de aplicaciones
   - Cambiar status: "Applied" → "Interview Scheduled"

#### **Minuto 10: Métricas y Cierre**

**Dashboard**:
```
GET /api/metrics/dashboard

{
  "totalJobs": 150,
  "activeJobs": 145,
  "totalApplications": 5,
  "applicationsByStatus": {
    "Applied": 3,
    "InterviewScheduled": 2
  },
  "averageRelevanceScore": 72.5,
  "jobsBySource": {
    "remoteok": 150
  }
}
```

**Cierre**:
```
"El sistema está completamente funcional end-to-end:

✅ Scraper automático (cron schedule)
✅ Pipeline de ingestion robusto (validation, dedup, scoring)
✅ API RESTful con Swagger
✅ Frontend moderno con React
✅ Tracking de aplicaciones
✅ Métricas en tiempo real

Próximos pasos:
- Agregar más sources (LinkedIn, Indeed)
- Implementar user preferences para scoring personalizado
- Background jobs para re-scoring
- Notificaciones por email
```

### 5.3 Demo Data Script

```bash
#!/bin/bash
# scripts/prepare-demo.sh

echo "🎬 Preparing Demo Environment"

# 1. Reset database
echo "🗄️ Resetting database..."
psql -U postgres -d jobautomation -c "TRUNCATE TABLE \"Applications\", \"Jobs\", \"Companies\", \"Metrics\" CASCADE;"

# 2. Seed with realistic data
echo "📊 Seeding test data..."
psql -U postgres -d jobautomation -f scripts/seed-test-data.sql

# 3. Run scraper to add fresh jobs
echo "🕷️ Running scraper..."
cd scraper
npm run dev:once

# 4. Verify data
echo "✅ Verifying data..."
JOBS_COUNT=$(psql -U postgres -d jobautomation -t -c "SELECT COUNT(*) FROM \"Jobs\";")
echo "Total jobs in database: $JOBS_COUNT"

if [ "$JOBS_COUNT" -lt 20 ]; then
  echo "⚠️ Warning: Less than 20 jobs. Demo might look empty."
fi

echo "✅ Demo environment ready!"
echo ""
echo "Start the system:"
echo "  1. Backend: cd backend/src/JobAutomation.WebAPI && dotnet run"
echo "  2. Frontend: cd frontend && npm run dev"
echo "  3. Open: http://localhost:5173"
```

---

## 6. Buenas Prácticas Implementadas

### 6.1 Arquitectura

✅ **Clean Architecture** (Backend)
- Separación de capas: Core, Infrastructure, WebAPI
- Dependency Inversion
- Use Cases como orquestadores

✅ **Separation of Concerns** (Scraper)
- Sources independientes
- Normalizers reutilizables
- Backend service desacoplado

✅ **API-First Design**
- Contratos claros con DTOs
- Swagger documentation
- Versionado preparado

### 6.2 Data Quality

✅ **Multi-level Deduplication**
- ExternalId + Source (exacto)
- Normalized URL (fuzzy)
- Batch queries (performance)

✅ **Validation Pipeline**
- Required fields
- Format validation
- Sanitization

✅ **Scoring System**
- Extensible con reglas
- Pesos configurables
- Recalculable

### 6.3 Error Handling

✅ **Partial Failure Support**
- Per-item error tracking
- Detailed error messages
- Batch continues on failure

✅ **Retry Mechanisms**
- Exponential backoff
- Configurable retries
- Circuit breaker pattern (futuro)

✅ **Logging**
- Structured logging
- Correlation IDs
- Error context

### 6.4 Performance

✅ **Batch Processing**
- Scraper: batches de 50
- Backend: batch queries
- Reduced N+1 queries

✅ **Pagination**
- Frontend: 20 items per page
- Backend: configurable page size
- Total count optimization

✅ **Caching Strategy** (futuro)
- Redis para métricas
- In-memory para lookups frecuentes

### 6.5 Security

✅ **API Key Authentication**
- Header: X-API-Key
- Configurable per environment

✅ **Input Validation**
- DTO validation
- SQL injection prevention (EF Core)
- XSS prevention (sanitization)

✅ **CORS Configuration**
- Whitelist de origins
- Credentials support

### 6.6 Observability

✅ **Metrics**
- Ingestion stats
- Application tracking
- Dashboard aggregations

✅ **Health Checks**
- Backend: /health endpoint
- Database connectivity
- Scraper: backend health check

✅ **Logging Levels**
- Development: Debug
- Production: Info/Warning/Error

---

## 7. Roadmap de Mejoras

### Fase 1: MVP Completo ✅
- [x] Scraper engine modular
- [x] Backend API con ingestion pipeline
- [x] Frontend básico con job listing
- [x] Application tracking
- [x] Deduplication y scoring

### Fase 2: Personalización (1-2 semanas)
- [ ] User authentication (JWT)
- [ ] User preferences para scoring
- [ ] Saved searches
- [ ] Email notifications

### Fase 3: Escalabilidad (2-3 semanas)
- [ ] Background jobs con Hangfire
- [ ] Redis caching
- [ ] Rate limiting
- [ ] Horizontal scaling

### Fase 4: Features Avanzados (1 mes)
- [ ] AI-powered job matching
- [ ] Resume parsing
- [ ] Company reviews integration
- [ ] Analytics dashboard

---

## 8. Comandos Rápidos

### Start Everything

```bash
# Terminal 1: Backend
cd backend/src/JobAutomation.WebAPI
dotnet run

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Scraper (scheduled)
cd scraper
npm run dev

# Terminal 4: Scraper (one-time)
cd scraper
npm run dev:once
```

### Reset & Seed

```bash
# Reset database
dotnet ef database drop --force --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI
dotnet ef database update --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI

# Seed test data
psql -U postgres -d jobautomation -f scripts/seed-test-data.sql
```

### Run Tests

```bash
# Backend unit tests
cd backend
dotnet test

# Backend integration tests
cd backend/tests/JobAutomation.IntegrationTests
dotnet test

# Frontend unit tests
cd frontend
npm run test

# Frontend E2E tests
cd frontend
npm run test:e2e
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Check jobs count
curl http://localhost:5000/api/jobs | jq '.data.totalCount'

# Check metrics
curl http://localhost:5000/api/metrics/dashboard | jq
```

---

## 9. Troubleshooting

### Backend no conecta a PostgreSQL

```bash
# Verify PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string in appsettings.json
cat backend/src/JobAutomation.WebAPI/appsettings.json | grep ConnectionStrings
```

### Scraper no puede enviar jobs

```bash
# Check backend is running
curl http://localhost:5000/health

# Check scraper .env
cat scraper/.env | grep BACKEND_URL

# Run scraper with debug logs
cd scraper
LOG_LEVEL=debug npm run dev:once
```

### Frontend no muestra jobs

```bash
# Check API connection
curl http://localhost:5000/api/jobs

# Check frontend .env
cat frontend/.env | grep VITE_API_BASE_URL

# Check browser console for CORS errors
# Open DevTools → Console
```

---

## Conclusión

Este documento define la estrategia completa para integrar Scraper → Backend → Frontend en un sistema funcional end-to-end. Los contratos API están claros, el flujo de datos está documentado, y la estrategia de testing cubre desde unit tests hasta E2E.

**El sistema está listo para demo y producción.**
