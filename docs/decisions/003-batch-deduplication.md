# ADR-003: Batch Deduplication Strategy

## Status

Accepted

## Context

When ingesting jobs, we need to detect duplicates efficiently. The naive approach (one query per job) creates N+1 query problems and doesn't scale.

We need a strategy that:
- Handles batches of 100 jobs efficiently
- Supports multiple deduplication criteria
- Minimizes database round trips

## Decision

Implement batch deduplication with two levels:

**Level 1: ExternalId + Source**
- Collect all ExternalIds from the batch
- Single query: `WHERE (ExternalId, Source) IN (...)`
- Build HashSet of existing combinations

**Level 2: Normalized URL**
- Collect all URLs, normalize them (remove tracking params, lowercase)
- Single query: `WHERE NormalizedUrl IN (...)`
- Build HashSet of existing URLs

Filter duplicates in-memory using the HashSets.

## Consequences

### Positive
- O(1) + 2 SQL queries instead of O(n) queries
- Scales well with batch size
- In-memory filtering is fast

### Negative
- More complex code than naive approach
- Memory usage grows with batch size
- URL normalization logic needs maintenance

### Trade-offs
- Level 3 (fuzzy matching) deferred to future iteration due to complexity and false positive risk
