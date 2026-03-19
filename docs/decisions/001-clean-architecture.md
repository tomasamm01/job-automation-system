# ADR-001: Clean Architecture for Backend

## Status

Accepted

## Context

We need a maintainable architecture for the backend that:
- Separates business logic from infrastructure concerns
- Allows easy testing of core functionality
- Supports future changes to data storage or external services
- Is familiar to .NET developers

## Decision

Adopt Clean Architecture with three layers:

1. **Core** - Domain entities, interfaces, DTOs, and use cases. No external dependencies.
2. **Infrastructure** - EF Core implementation, repositories, external services.
3. **WebAPI** - Controllers, middleware, API configuration.

Dependency flow: WebAPI → Infrastructure → Core

## Consequences

### Positive
- Business logic is isolated and testable
- Easy to swap infrastructure (e.g., change database)
- Clear separation of concerns
- Familiar pattern for .NET developers

### Negative
- More boilerplate code (interfaces, DTOs)
- Learning curve for contributors unfamiliar with the pattern
- Potential over-engineering for simple features
