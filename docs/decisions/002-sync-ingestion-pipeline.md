# ADR-002: Synchronous Ingestion Pipeline

## Status

Accepted

## Context

The job ingestion pipeline needs to process batches of jobs from scrapers. We need to decide whether processing should be synchronous (blocking) or asynchronous (queued).

Considerations:
- Scrapers need immediate feedback on what succeeded/failed
- Processing time per job is fast (<20ms)
- Current scale is <10,000 jobs/day
- Simplicity is valued over premature optimization

## Decision

Implement all pipeline stages synchronously:
- Validation
- Deduplication
- Scoring
- Persistence

The API returns a complete response with counts of created, duplicated, and failed items.

## Consequences

### Positive
- Immediate feedback to scrapers
- Simpler architecture (no message queues)
- Easier debugging and monitoring
- Transactional consistency

### Negative
- API latency increases with batch size
- No automatic retry for transient failures
- Single point of failure

### Mitigation
- Limit batch size to 100 items
- Document expected latency
- Plan migration path to async (Phase 2) when scale requires it
