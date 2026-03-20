# Scraper Engine Architecture

## Overview

The scraper engine is designed as a **modular ingestion service** that collects job postings from multiple sources and feeds them into the backend pipeline.

## Core Principles

### 1. Single Responsibility
- **Scraper**: Only collects and normalizes data
- **Backend**: Handles validation, deduplication, scoring, and persistence

### 2. Modularity
Each source is a self-contained module that can be:
- Enabled/disabled independently
- Scheduled separately
- Developed and tested in isolation

### 3. Fault Tolerance
- One failing source doesn't crash the system
- Automatic retries with exponential backoff
- Graceful error handling and logging

### 4. Scalability
- Easy to add new sources (just extend base classes)
- Configurable concurrency and rate limits
- Batch processing for efficient data transfer

## Component Architecture

### Layer 1: Sources

**Responsibility**: Fetch raw job data from external sources

```typescript
interface IJobSource {
  readonly name: string;
  readonly config: ScraperConfig;
  fetchJobs(): Promise<JobRaw[]>;
}
```

**Implementation**:
- Extends `BaseSource` abstract class
- Uses HTTP client with rate limiting
- Returns array of `JobRaw` objects

**Example Sources**:
- RemoteOK (Public API)
- LinkedIn (Scraping - requires authentication)
- GetOnBoard (Public API)
- Greenhouse ATS (Public job boards)

### Layer 2: Normalizers

**Responsibility**: Transform source-specific data to standard format

```typescript
interface IJobNormalizer {
  normalize(raw: JobRaw): JobNormalized;
  validateJob(job: JobNormalized): boolean;
}
```

**Normalization includes**:
- Standardizing field names
- Cleaning whitespace
- Normalizing enums (workMode, jobType)
- Validating required fields

### Layer 3: Services

#### Backend Service
Handles communication with the backend API:
- Batches jobs for efficient transmission
- Implements retry logic
- Handles authentication
- Reports errors

#### Orchestrator
Coordinates the scraping workflow:
- Manages source execution
- Applies normalization
- Tracks metrics (jobs found, normalized, sent)
- Aggregates results

#### Scheduler
Manages automated execution:
- Uses cron expressions for scheduling
- Supports manual triggers
- Graceful start/stop

### Layer 4: Utilities

#### Logger
- Structured logging with Winston
- Source-specific loggers
- Multiple transports (console, file)
- Configurable log levels

#### Rate Limiter
- Token bucket algorithm
- Per-source configuration
- Prevents API abuse

#### Retry Handler
- Exponential backoff
- Configurable max retries
- Context-aware error messages

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                      SCHEDULER                            │
│  (Triggers sources based on cron schedules)              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR                            │
│  (Coordinates execution and tracks results)              │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   SOURCE 1   │          │   SOURCE 2   │
│  (RemoteOK)  │          │  (LinkedIn)  │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │ JobRaw[]                │ JobRaw[]
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ NORMALIZER 1 │          │ NORMALIZER 2 │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │ JobNormalized[]         │ JobNormalized[]
       └────────────┬────────────┘
                    ▼
        ┌───────────────────────┐
        │   BACKEND SERVICE     │
        │  (Batch + Send)       │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │   BACKEND API         │
        │ POST /api/jobs/ingest │
        └───────────────────────┘
```

## Error Handling Strategy

### Source Level
```typescript
try {
  const jobs = await source.fetchJobs();
} catch (error) {
  logger.error(`Source ${source.name} failed`, error);
  // Continue with other sources
}
```

### Normalization Level
```typescript
const normalizedJobs = rawJobs
  .map(raw => {
    try {
      return normalizer.normalize(raw);
    } catch (error) {
      logger.error(`Failed to normalize job`, error);
      return null;
    }
  })
  .filter(job => job !== null);
```

### Backend Level
```typescript
await withRetry(
  () => backendService.sendJobs(batch),
  { maxRetries: 3, delayMs: 1000, backoff: true },
  'Sending batch'
);
```

## Scheduling Strategy

### Frequency Guidelines

**High-frequency sources** (every 30 min):
- RemoteOK (fast API, frequently updated)
- WeWorkRemotely

**Medium-frequency sources** (every 2-3 hours):
- LinkedIn (rate limits, slower updates)
- Indeed (large volume)

**Low-frequency sources** (daily):
- Company career pages
- Niche job boards

### Cron Configuration

```typescript
const config = {
  remoteok: {
    schedule: '*/30 * * * *',  // Every 30 minutes
  },
  linkedin: {
    schedule: '0 */2 * * *',   // Every 2 hours
  },
  getonboard: {
    schedule: '0 9,17 * * *',  // 9 AM and 5 PM
  },
};
```

## Performance Optimization

### 1. Rate Limiting
```typescript
rateLimit: {
  maxRequests: 10,
  perMilliseconds: 60000, // 10 requests per minute
}
```

### 2. Batch Processing
```typescript
const batchSize = 50; // Send 50 jobs per request
```

### 3. Concurrent Execution
```typescript
await Promise.allSettled(
  sources.map(source => orchestrator.runSource(source))
);
```

### 4. Memory Management
- Process jobs in batches
- Don't store all jobs in memory
- Stream large datasets when possible

## Extensibility

### Adding a New Source Type

1. **API-based source**: Extend `BaseSource`
2. **HTML scraping**: Use Cheerio in extractor
3. **Authenticated source**: Add auth to HTTP client
4. **Webhook-based**: Create separate webhook handler

### Adding New Fields

1. Update `JobRaw` interface
2. Update `JobNormalized` interface
3. Update normalizer logic
4. Backend handles the rest

### Adding New Normalizations

Override methods in source-specific normalizer:

```typescript
class LinkedInNormalizer extends BaseNormalizer {
  protected normalizeLocation(location: string): string {
    // LinkedIn-specific location parsing
    return parseLinkedInLocation(location);
  }
}
```

## Testing Strategy

### Unit Tests
- Test each source independently
- Mock external API calls
- Test normalization logic

### Integration Tests
- Test orchestrator with mock sources
- Test backend service with mock API
- Test scheduler timing

### E2E Tests
- Test full flow with real APIs (in staging)
- Verify data reaches backend correctly

## Deployment Considerations

### Environment-specific Configuration
- Development: Frequent schedules, verbose logging
- Staging: Production-like schedules, test data
- Production: Optimized schedules, error alerting

### Monitoring
- Track jobs processed per source
- Monitor error rates
- Alert on consecutive failures
- Track API rate limit usage

### Scaling
- Run multiple instances with different source sets
- Use message queue for high-volume sources
- Implement distributed locking for coordination

## Security Considerations

1. **API Keys**: Store in environment variables, never commit
2. **Rate Limiting**: Respect source terms of service
3. **User Agents**: Identify scraper clearly
4. **Robots.txt**: Respect when scraping HTML
5. **Data Privacy**: Don't store PII unnecessarily

## Future Enhancements

1. **Webhook Support**: Real-time job ingestion
2. **Incremental Updates**: Only fetch new jobs
3. **Distributed Workers**: Scale horizontally
4. **ML-based Filtering**: Pre-filter irrelevant jobs
5. **Metrics Dashboard**: Real-time monitoring UI
