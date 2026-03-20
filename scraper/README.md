# Job Scraper Engine

A modular, scalable scraper engine for the Job Automation System. Designed to collect job postings from multiple sources and send them to the backend ingestion API.

## Architecture

```
/scraper
  /src
    /config          # Configuration management
    /types           # TypeScript interfaces and types
    /sources         # Source-specific scrapers
      /remoteok      # RemoteOK implementation
      /linkedin      # LinkedIn (template)
      /getonboard    # GetOnBoard (template)
    /normalizers     # Data normalization
    /services        # Core services (backend, scheduler, orchestrator)
    /utils           # Utilities (logger, retry, rate-limiter)
    index.ts         # Entry point
```

## Key Design Principles

1. **Separation of Concerns**: Each source is independent and isolated
2. **No Business Logic**: Scraper only collects and normalizes data
3. **Error Isolation**: One failing source doesn't break the entire system
4. **Scalability**: Easy to add new sources
5. **Rate Limiting**: Built-in protection against overwhelming sources
6. **Batch Processing**: Efficient data transmission to backend

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `env.template` to `.env` and configure:

```bash
cp env.template .env
```

Edit `.env`:

```env
BACKEND_URL=http://localhost:5000
REMOTEOK_ENABLED=true
REMOTEOK_SCHEDULE=*/30 * * * *
```

### 3. Run the Scraper

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API URL | `http://localhost:5000` |
| `BACKEND_API_KEY` | API key for backend | - |
| `BATCH_SIZE` | Jobs per batch | `50` |
| `LOG_LEVEL` | Logging level | `info` |
| `REMOTEOK_ENABLED` | Enable RemoteOK scraper | `true` |
| `REMOTEOK_SCHEDULE` | Cron schedule for RemoteOK | `*/30 * * * *` |

### Cron Schedule Examples

- `*/30 * * * *` - Every 30 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * *` - Daily at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM

## Adding a New Source

### Step 1: Create Source Directory

```bash
mkdir -p src/sources/newsource
```

### Step 2: Implement Source Class

Create `src/sources/newsource/newsource-source.ts`:

```typescript
import { BaseSource } from '../base-source';
import { JobRaw, ScraperConfig } from '../../types';

export class NewSourceSource extends BaseSource {
  constructor() {
    const config: ScraperConfig = {
      name: 'NewSource',
      enabled: true,
      schedule: '0 */3 * * *', // Every 3 hours
      batchSize: 50,
      rateLimit: {
        maxRequests: 10,
        perMilliseconds: 60000,
      },
    };

    super('NewSource', config);
  }

  async fetchJobs(): Promise<JobRaw[]> {
    try {
      this.logger.info('Starting scrape');

      // Fetch data from API or scrape HTML
      const data = await this.fetchWithRateLimit<any[]>('https://api.example.com/jobs');

      // Map to JobRaw format
      const jobs = data.map(item => this.mapToJobRaw(item));

      this.logger.info(`Found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      this.logger.error('Failed to fetch jobs', error);
      throw error;
    }
  }

  private mapToJobRaw(item: any): JobRaw {
    return {
      externalId: item.id,
      source: 'newsource',
      title: item.title,
      company: item.company,
      location: item.location || 'Remote',
      url: item.url,
      description: item.description,
      salaryMin: item.salary_min || null,
      salaryMax: item.salary_max || null,
      workMode: item.remote ? 'remote' : 'onsite',
      jobType: 'full-time',
    };
  }
}
```

### Step 3: Create Normalizer (Optional)

Create `src/sources/newsource/newsource-normalizer.ts`:

```typescript
import { BaseNormalizer } from '../../normalizers/base-normalizer';

export class NewSourceNormalizer extends BaseNormalizer {
  // Override methods if needed for source-specific normalization
  protected normalizeLocation(location: string): string {
    // Custom location normalization
    return super.normalizeLocation(location);
  }
}
```

### Step 4: Register in Main

Edit `src/index.ts`:

```typescript
import { NewSourceSource, NewSourceNormalizer } from './sources/newsource';

// In main() function:
const newSource = new NewSourceSource();
const newSourceNormalizer = new NewSourceNormalizer();
orchestrator.registerNormalizer(newSource.name, newSourceNormalizer);
scheduler.addJob(newSource);
```

## Data Flow

```
┌─────────────┐
│   Source    │ ──► Fetch jobs from external API/website
└─────────────┘
       │
       ▼
┌─────────────┐
│  Extractor  │ ──► Parse and extract relevant fields
└─────────────┘
       │
       ▼
┌─────────────┐
│ Normalizer  │ ──► Convert to standard format + validate
└─────────────┘
       │
       ▼
┌─────────────┐
│   Backend   │ ──► Send to /api/jobs/ingest
│   Service   │
└─────────────┘
```

## Output Format

Jobs are normalized to this format before sending to backend:

```json
{
  "externalId": "unique-job-id",
  "source": "remoteok",
  "title": "Senior Backend Engineer",
  "company": "TechCorp",
  "location": "Remote - Worldwide",
  "url": "https://...",
  "description": "We are looking for...",
  "salaryMin": 100000,
  "salaryMax": 150000,
  "workMode": "remote",
  "jobType": "full-time"
}
```

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console - Colored output

Log levels: `error`, `warn`, `info`, `debug`

## Error Handling

- **Source-level isolation**: Each source runs independently
- **Retry mechanism**: Failed requests retry with exponential backoff
- **Graceful degradation**: System continues if one source fails
- **Detailed logging**: All errors are logged with context

## Performance Considerations

1. **Rate Limiting**: Prevents overwhelming external APIs
2. **Batch Processing**: Sends jobs in configurable batches
3. **Concurrent Sources**: Multiple sources can run in parallel
4. **Memory Efficient**: Processes jobs in streams when possible

## Monitoring

Check logs for:
- Jobs found per source
- Jobs normalized successfully
- Jobs sent to backend
- Error rates
- Execution duration

Example log output:
```
[RemoteOK] Starting RemoteOK scraping
[RemoteOK] Found 150 jobs from RemoteOK
[RemoteOK] Successfully processed RemoteOK { found: 150, normalized: 148, sent: 148 }
```

## Troubleshooting

### Backend Connection Failed

Check `BACKEND_URL` in `.env` and ensure backend is running:
```bash
curl http://localhost:5000/health
```

### No Jobs Found

- Check if source is enabled in `.env`
- Verify source API is accessible
- Check rate limits aren't being hit
- Review logs for specific errors

### TypeScript Errors

Ensure dependencies are installed:
```bash
npm install
```

## License

MIT
