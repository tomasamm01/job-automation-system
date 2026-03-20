# Production Enhancements

This document describes the production-ready enhancements added to the scraper engine.

## Overview

The enhanced scraper includes:
1. **Local cache** for deduplication across executions
2. **Metrics collection** with detailed execution tracking
3. **Health check endpoint** for monitoring
4. **Circuit breaker** for backend resilience
5. **Backpressure control** to prevent overload
6. **Enhanced retry logic** with error classification
7. **Structured logging** with execution context

## 1. Local Cache System

**Location**: `src/cache/local-cache.ts`

### Features
- File-based cache (no external dependencies)
- TTL-based expiration (default: 24 hours)
- Automatic cleanup (default: every 6 hours)
- Per-source deduplication
- Persistent across restarts

### Usage
```typescript
const cache = new LocalCache('./cache', 24, 6);
await cache.initialize();

// Check if job exists
if (cache.has('remoteok', 'job-123')) {
  // Skip processing
}

// Add job to cache
cache.add('remoteok', 'job-123');

// Filter new jobs
const newJobs = cache.filterNew('remoteok', allJobIds);
```

### Benefits
- **Prevents duplicate processing** between scraper runs
- **Reduces backend load** by filtering already-seen jobs
- **Improves efficiency** by skipping redundant work

### Storage
- Cache file: `./cache/jobs-cache.json`
- Format: JSON with entries and timestamps
- Auto-cleanup removes expired entries

## 2. Metrics Collection

**Location**: `src/metrics/metrics-collector.ts`

### Tracked Metrics

Per execution:
- `jobsFetched` - Jobs retrieved from source
- `jobsFiltered` - Jobs after cache filtering
- `jobsNormalized` - Successfully normalized jobs
- `jobsValidated` - Jobs passing validation
- `jobsSent` - Jobs sent to backend
- `jobsFailed` - Failed jobs
- `cacheHits` - Cache hits count
- `cacheMisses` - Cache misses count
- `backendRetries` - Backend retry attempts
- `errors` - Detailed error log
- `durationMs` - Execution time

### Usage
```typescript
const collector = new MetricsCollector('./metrics');
await collector.initialize();

const execId = collector.startExecution('RemoteOK');
collector.recordFetched(execId, 100);
collector.recordFiltered(execId, 80);
// ... more recording
await collector.endExecution(execId);
```

### Aggregated Metrics
```typescript
const metrics = await collector.getAggregatedMetrics(24); // Last 24 hours
```

Returns:
- Total executions
- Success/failure rates
- Average duration
- Error rate
- Per-source breakdown

### Storage
- Metrics files: `./metrics/YYYY-MM-DD-{source}-{execId}.json`
- One file per execution
- Queryable for historical analysis

## 3. Health Check Endpoint

**Location**: `src/health/health-server.ts`

### Endpoints

#### GET /health
Returns system health status:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-20T10:00:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "cache": {
    "enabled": true,
    "entries": 1250,
    "stats": { ... }
  },
  "metrics": {
    "last24h": { ... }
  },
  "sources": [
    {
      "name": "RemoteOK",
      "enabled": true,
      "lastRun": "2024-03-20T09:30:00.000Z",
      "status": "success"
    }
  ]
}
```

Status codes:
- `200` - Healthy or degraded
- `503` - Unhealthy

#### GET /metrics
Returns aggregated metrics for last 24 hours:
```json
{
  "period": "Last 24 hours",
  "totalExecutions": 48,
  "successfulExecutions": 47,
  "failedExecutions": 1,
  "totalJobsProcessed": 2400,
  "totalJobsSent": 1850,
  "averageDurationMs": 5234,
  "errorRate": 2.08,
  "bySource": {
    "RemoteOK": {
      "executions": 48,
      "jobsProcessed": 2400,
      "jobsSent": 1850,
      "averageDurationMs": 5234
    }
  }
}
```

#### GET /cache/stats
Returns cache statistics:
```json
{
  "total": 1250,
  "expired": 50,
  "bySource": {
    "remoteok": 1200,
    "linkedin": 50
  },
  "oldestEntry": "2024-03-19T10:00:00.000Z"
}
```

### Usage
```typescript
const healthServer = new HealthServer(3000);
healthServer.setCache(cache);
healthServer.setMetricsCollector(metricsCollector);
await healthServer.start();
```

Access:
- `http://localhost:3000/health`
- `http://localhost:3000/metrics`
- `http://localhost:3000/cache/stats`

## 4. Circuit Breaker

**Location**: `src/utils/retry.ts`

### Purpose
Prevents cascading failures by stopping requests to failing services.

### States
- **CLOSED** - Normal operation
- **OPEN** - Service failing, requests blocked
- **HALF_OPEN** - Testing if service recovered

### Configuration
```typescript
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,      // Open after 5 failures
  resetTimeoutMs: 60000,    // Try recovery after 60s
});
```

### Behavior
1. After 5 consecutive failures → OPEN
2. Wait 60 seconds → HALF_OPEN
3. If 2 successes → CLOSED
4. If failure → OPEN again

### Benefits
- **Prevents backend overload** during outages
- **Fast failure** instead of waiting for timeouts
- **Automatic recovery** when service restored

## 5. Backpressure Control

**Location**: `src/utils/backpressure.ts`

### Purpose
Limits concurrent operations to prevent system overload.

### Configuration
```typescript
const backpressure = new BackpressureController({
  maxConcurrent: 3,      // Max 3 concurrent operations
  maxQueueSize: 10,      // Max 10 queued operations
  timeout: 60000,        // 60s timeout per operation
});
```

### Behavior
- Limits concurrent source fetches
- Queues excess requests
- Rejects when queue full
- Enforces operation timeouts

### Benefits
- **Prevents memory exhaustion** from too many concurrent operations
- **Protects external APIs** from rate limit violations
- **Graceful degradation** under high load

## 6. Enhanced Retry Logic

**Location**: `src/utils/retry.ts`

### Features

#### Error Classification
Distinguishes retryable vs non-retryable errors:

**Retryable**:
- HTTP 408, 429, 500, 502, 503, 504
- Network errors: ECONNRESET, ETIMEDOUT, ENOTFOUND, ECONNREFUSED

**Non-retryable**:
- HTTP 400, 401, 403, 404
- Validation errors
- Business logic errors

#### Exponential Backoff
```typescript
delay = baseDelay * 2^(attempt - 1)
```

With max delay cap (default: 30s)

#### Retry Callback
```typescript
await withRetry(
  () => fetchData(),
  {
    maxRetries: 3,
    delayMs: 1000,
    onRetry: (attempt, error) => {
      metricsCollector.recordBackendRetry(execId);
    }
  },
  'Fetch data'
);
```

## 7. Structured Logging

### Execution Context
All logs include execution ID for tracing:

```typescript
logger.info('Starting scrape', { executionId: 'remoteok-123' });
logger.warn('Filtered jobs', {
  executionId: 'remoteok-123',
  total: 100,
  new: 80,
  cached: 20
});
```

### Log Levels
- `error` - Failures requiring attention
- `warn` - Degraded performance or retries
- `info` - Normal operations
- `debug` - Detailed troubleshooting

### Structured Fields
```json
{
  "level": "info",
  "message": "Successfully processed RemoteOK",
  "timestamp": "2024-03-20 10:00:00",
  "executionId": "remoteok-1234",
  "found": 100,
  "filtered": 80,
  "normalized": 78,
  "sent": 78
}
```

## Migration Guide

### From Basic to Enhanced

**Step 1**: Update imports
```typescript
// Before
import { ScraperOrchestrator } from './services/orchestrator';

// After
import { EnhancedOrchestrator } from './services/enhanced-orchestrator';
```

**Step 2**: Initialize components
```typescript
const cache = new LocalCache();
await cache.initialize();

const metricsCollector = new MetricsCollector();
await metricsCollector.initialize();

const healthServer = new HealthServer(3000);
```

**Step 3**: Configure orchestrator
```typescript
const orchestrator = new EnhancedOrchestrator(backendService);
orchestrator.setCache(cache);
orchestrator.setMetricsCollector(metricsCollector);
orchestrator.setBackpressure(backpressureController);
orchestrator.setCircuitBreaker(circuitBreaker);
```

**Step 4**: Start health server
```typescript
healthServer.setCache(cache);
healthServer.setMetricsCollector(metricsCollector);
await healthServer.start();
```

**Step 5**: Use enhanced entry point
```bash
# Instead of
npm run dev

# Use
npm run dev:enhanced
```

### Package.json Updates
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "dev:enhanced": "tsx watch src/index-enhanced.ts",
    "start": "node dist/index.js",
    "start:enhanced": "node dist/index-enhanced.js"
  }
}
```

## Performance Impact

### Memory
- Cache: ~1MB per 10,000 jobs
- Metrics: ~100KB per execution
- Total overhead: ~5-10MB

### CPU
- Cache lookup: O(1)
- Metrics recording: Negligible
- Overall impact: <5%

### Disk I/O
- Cache save: Once per shutdown + periodic cleanup
- Metrics save: Once per execution
- Minimal impact on performance

## Monitoring Recommendations

### Health Checks
```bash
# Add to monitoring system
curl http://localhost:3000/health

# Alert if status != "healthy"
# Alert if errorRate > 10%
```

### Metrics Review
```bash
# Daily metrics check
curl http://localhost:3000/metrics

# Track trends:
# - Success rate
# - Average duration
# - Jobs processed
```

### Cache Monitoring
```bash
# Weekly cache review
curl http://localhost:3000/cache/stats

# Alert if:
# - Cache size > 100,000 entries
# - Expired entries > 20%
```

## Troubleshooting

### High Cache Hit Rate (>90%)
**Cause**: Source not providing new jobs
**Action**: Check source API, verify schedule frequency

### Circuit Breaker Stuck Open
**Cause**: Backend consistently failing
**Action**: Check backend health, review backend logs

### High Error Rate (>10%)
**Cause**: Source API changes or network issues
**Action**: Review error logs, update source implementation

### Memory Growth
**Cause**: Cache not cleaning up
**Action**: Reduce TTL, increase cleanup frequency

## Best Practices

1. **Monitor health endpoint** - Set up alerts for degraded status
2. **Review metrics daily** - Track trends and anomalies
3. **Clean old metrics** - Archive files older than 30 days
4. **Tune cache TTL** - Based on source update frequency
5. **Adjust backpressure** - Based on system resources
6. **Test circuit breaker** - Verify recovery behavior
7. **Structured logging** - Always include execution context

## Future Enhancements

- [ ] Prometheus metrics export
- [ ] Distributed cache (Redis optional)
- [ ] Advanced alerting rules
- [ ] Metrics dashboard UI
- [ ] Performance profiling
- [ ] A/B testing framework
