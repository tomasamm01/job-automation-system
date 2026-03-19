# Contributing to Job Automation System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Branch Naming](#branch-naming)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

---

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful.

---

## Getting Started

### Prerequisites

- **Backend**: .NET 8 SDK, PostgreSQL 14+
- **Frontend**: Node.js 20+, npm/yarn
- **Scraper**: Node.js 20+

### Local Setup

1. Fork and clone the repository
2. Follow the setup instructions in the component's README:
   - [Backend Setup](backend/README.md)

---

## Development Workflow

### 1. Create an Issue

Before starting work, create or find an existing issue describing the change.

### 2. Create a Branch

```bash
git checkout -b <type>/<short-description>
```

See [Branch Naming](#branch-naming) for conventions.

### 3. Make Changes

- Write clean, readable code
- Add tests for new functionality
- Update documentation if needed

### 4. Commit Changes

Follow [Conventional Commits](#commit-conventions).

### 5. Open a Pull Request

- Fill out the PR template completely
- Link the related issue
- Request review when ready

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/). This enables automatic changelog generation and semantic versioning.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks (deps, config, etc.) |
| `ci` | CI/CD changes |

### Scopes

| Scope | Description |
|-------|-------------|
| `backend` | Backend API changes |
| `frontend` | Frontend changes |
| `scraper` | Scraper changes |
| `docs` | Documentation |
| `deps` | Dependencies |

### Examples

```bash
# Feature
feat(backend): add batch job ingestion endpoint

# Bug fix
fix(backend): handle null salary range in scoring

# Documentation
docs: update API endpoint documentation

# Refactor
refactor(backend): extract deduplication logic to service

# Breaking change (use ! or BREAKING CHANGE footer)
feat(backend)!: change ingestion response format
```

---

## Branch Naming

### Format

```
<type>/<issue-number>-<short-description>
```

### Types

| Prefix | Use Case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `refactor/` | Code refactoring |
| `chore/` | Maintenance |

### Examples

```
feature/42-batch-ingestion
fix/15-null-salary-scoring
docs/update-api-docs
refactor/extract-dedup-service
```

---

## Pull Request Process

1. **Ensure CI passes**: All checks must be green
2. **Self-review**: Review your own code first
3. **Update docs**: If you changed behavior, update documentation
4. **Add tests**: New features need tests; bug fixes need regression tests
5. **Keep PRs focused**: One feature/fix per PR
6. **Respond to feedback**: Address review comments promptly

### PR Size Guidelines

- **Small** (<200 lines): Ideal, quick review
- **Medium** (200-500 lines): Acceptable for features
- **Large** (>500 lines): Consider splitting

---

## Code Style

### Backend (.NET)

- Follow [Microsoft C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Use meaningful names for classes, methods, and variables
- Keep methods focused and small
- Use async/await for I/O operations
- Add XML documentation for public APIs

### Frontend (React)

- Use functional components with hooks
- Follow component naming: PascalCase
- Keep components small and focused
- Use TypeScript for type safety

### General

- No commented-out code in commits
- Remove console.log/debug statements before PR
- Write self-documenting code; add comments only when necessary

---

## Questions?

Open an issue with the `question` label or start a discussion.

Thank you for contributing!
