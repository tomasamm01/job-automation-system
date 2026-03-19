# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting significant technical decisions made in this project.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context and consequences.

## ADR Template

When adding a new ADR, use this template:

```markdown
# ADR-XXX: Title

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?
```

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [001](001-clean-architecture.md) | Clean Architecture for Backend | Accepted |
| [002](002-sync-ingestion-pipeline.md) | Synchronous Ingestion Pipeline | Accepted |
| [003](003-batch-deduplication.md) | Batch Deduplication Strategy | Accepted |

---

*Note: Detailed technical decisions are also documented in [ARCHITECTURE.md](../ARCHITECTURE.md)*
