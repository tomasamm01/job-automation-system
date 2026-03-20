# Sources Directory

This directory contains all job source scrapers. Each source is a self-contained module.

## Structure

```
/sources
  /remoteok          # RemoteOK scraper (implemented)
  /linkedin          # LinkedIn scraper (template)
  /getonboard        # GetOnBoard scraper (template)
  base-source.ts     # Abstract base class
```

## Implemented Sources

### RemoteOK
- **Status**: ✅ Fully implemented
- **Type**: Public API
- **Schedule**: Every 30 minutes
- **Rate Limit**: 10 requests/minute
- **URL**: https://remoteok.com/api

## Template Sources

### LinkedIn
- **Status**: 🚧 Template only
- **Type**: Web scraping (requires authentication)
- **Notes**: Needs implementation of scraping logic

### GetOnBoard
- **Status**: 🚧 Template only
- **Type**: Public API
- **Notes**: Needs API integration

## Creating a New Source

### Step 1: Create Directory

```bash
mkdir -p src/sources/newsource
```

### Step 2: Create Source File

`src/sources/newsource/newsource-source.ts`:

```typescript
import { BaseSource } from '../base-source';
import { JobRaw, ScraperConfig } from '../../types';

export class NewSourceSource extends BaseSource {
  private readonly API_URL = 'https://api.example.com/jobs';

  constructor() {
    const config: ScraperConfig = {
      name: 'NewSource',
      enabled: true,
      schedule: '0 */2 * * *', // Every 2 hours
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

      // Fetch from API
      const data = await this.fetchWithRateLimit<any[]>(this.API_URL);

      // Map to JobRaw
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
      workMode: 'remote',
      jobType: 'full-time',
    };
  }
}
```

### Step 3: Create Normalizer (Optional)

`src/sources/newsource/newsource-normalizer.ts`:

```typescript
import { BaseNormalizer } from '../../normalizers/base-normalizer';

export class NewSourceNormalizer extends BaseNormalizer {
  // Override methods for source-specific normalization
}
```

### Step 4: Create Index

`src/sources/newsource/index.ts`:

```typescript
export { NewSourceSource } from './newsource-source';
export { NewSourceNormalizer } from './newsource-normalizer';
```

### Step 5: Register in Main

Edit `src/index.ts`:

```typescript
import { NewSourceSource, NewSourceNormalizer } from './sources/newsource';

// In main():
const newSource = new NewSourceSource();
const newSourceNormalizer = new NewSourceNormalizer();
orchestrator.registerNormalizer(newSource.name, newSourceNormalizer);
scheduler.addJob(newSource);
```

### Step 6: Add Configuration

Edit `src/config/index.ts`:

```typescript
sources: {
  // ... existing sources
  newsource: {
    enabled: process.env.NEWSOURCE_ENABLED === 'true',
    schedule: process.env.NEWSOURCE_SCHEDULE || '0 */2 * * *',
  },
}
```

Edit `env.template`:

```env
# NewSource Configuration
NEWSOURCE_ENABLED=false
NEWSOURCE_SCHEDULE=0 */2 * * *
```

## Source Types

### API-based Sources

**Pros:**
- Reliable structure
- Fast
- Easy to parse

**Cons:**
- May require API keys
- Rate limits
- May not have all job boards

**Example:** RemoteOK, Indeed API

### Web Scraping Sources

**Pros:**
- Access to any public job board
- No API key needed

**Cons:**
- Fragile (breaks when HTML changes)
- Slower
- May violate ToS

**Example:** LinkedIn, company career pages

**Implementation:**

```typescript
import * as cheerio from 'cheerio';

async fetchJobs(): Promise<JobRaw[]> {
  const html = await this.fetchWithRateLimit<string>('https://example.com/jobs');
  const $ = cheerio.load(html);
  
  const jobs: JobRaw[] = [];
  
  $('.job-listing').each((_, element) => {
    const title = $(element).find('.job-title').text();
    const company = $(element).find('.company-name').text();
    // ... extract other fields
    
    jobs.push({
      externalId: $(element).attr('data-id') || '',
      source: 'example',
      title,
      company,
      // ... other fields
    });
  });
  
  return jobs;
}
```

### RSS/Atom Feed Sources

**Pros:**
- Standardized format
- Easy to parse
- Real-time updates

**Cons:**
- Limited metadata
- Not all sites provide feeds

**Example:** Stack Overflow Jobs, GitHub Jobs (deprecated)

## Best Practices

### 1. Error Handling

Always wrap fetch logic in try-catch:

```typescript
async fetchJobs(): Promise<JobRaw[]> {
  try {
    // Fetch logic
  } catch (error) {
    this.logger.error('Failed to fetch', error);
    throw error; // Let orchestrator handle
  }
}
```

### 2. Rate Limiting

Configure appropriate rate limits:

```typescript
rateLimit: {
  maxRequests: 10,      // Conservative
  perMilliseconds: 60000, // 1 minute
}
```

### 3. Logging

Log important events:

```typescript
this.logger.info('Starting scrape');
this.logger.info(`Found ${jobs.length} jobs`);
this.logger.warn('Unexpected data format');
this.logger.error('API request failed', error);
```

### 4. Data Validation

Validate before returning:

```typescript
const jobs = data
  .filter(item => item.id && item.title)
  .map(item => this.mapToJobRaw(item));
```

### 5. Respect ToS

- Read and follow terms of service
- Implement appropriate delays
- Identify your scraper with User-Agent
- Don't overwhelm servers

## Testing

### Unit Test Example

```typescript
import { NewSourceSource } from './newsource-source';

describe('NewSourceSource', () => {
  it('should fetch and map jobs correctly', async () => {
    const source = new NewSourceSource();
    const jobs = await source.fetchJobs();
    
    expect(jobs).toBeInstanceOf(Array);
    expect(jobs[0]).toHaveProperty('externalId');
    expect(jobs[0]).toHaveProperty('source', 'newsource');
  });
});
```

## Troubleshooting

### Source Returns Empty Array

1. Check if API is accessible
2. Verify API response format hasn't changed
3. Check rate limits
4. Review logs for errors

### Source Throws Errors

1. Check network connectivity
2. Verify API endpoint is correct
3. Check authentication/API keys
4. Review error logs

### Jobs Not Appearing in Backend

1. Verify normalization is correct
2. Check backend logs
3. Ensure jobs pass validation
4. Check for duplicates (backend deduplication)

## Future Enhancements

- [ ] Implement LinkedIn scraper
- [ ] Implement GetOnBoard API integration
- [ ] Add Indeed API source
- [ ] Add Greenhouse ATS scraper
- [ ] Add WeWorkRemotely source
- [ ] Add AngelList/Wellfound source
- [ ] Add company-specific scrapers
