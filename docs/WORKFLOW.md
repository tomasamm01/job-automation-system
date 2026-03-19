# Development Workflow

This document describes the recommended workflow for contributing to this project.

## Git Workflow

We use a simplified Git Flow:

```
main (production-ready)
  │
  └── develop (integration branch)
        │
        ├── feature/xxx
        ├── fix/xxx
        └── ...
```

### Branches

| Branch | Purpose | Merges to |
|--------|---------|-----------|
| `main` | Production-ready code | - |
| `develop` | Integration branch | `main` |
| `feature/*` | New features | `develop` |
| `fix/*` | Bug fixes | `develop` |
| `hotfix/*` | Urgent production fixes | `main` + `develop` |

---

## Workflow Steps

### 1. Start from an Issue

Every change should be linked to an issue. Create one if it doesn't exist.

### 2. Create a Branch

```bash
# Sync with develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/42-add-salary-filter
```

### 3. Make Changes

- Write code following project conventions
- Add/update tests
- Update documentation if needed

### 4. Commit with Conventional Commits

```bash
git add .
git commit -m "feat(backend): add salary range filter to job search"
```

See [CONTRIBUTING.md](../CONTRIBUTING.md#commit-conventions) for commit format.

### 5. Push and Create PR

```bash
git push origin feature/42-add-salary-filter
```

Then create a Pull Request on GitHub:
- Fill out the PR template
- Link the issue: "Closes #42"
- Request review

### 6. Address Review Feedback

- Respond to comments
- Push additional commits
- Re-request review when ready

### 7. Merge

Once approved and CI passes:
- Squash and merge (preferred for clean history)
- Delete the branch

---

## Commit Message Examples

```bash
# Features
feat(backend): add batch job ingestion endpoint
feat(frontend): implement job search filters
feat(scraper): add LinkedIn job parser

# Bug fixes
fix(backend): handle null salary in scoring calculation
fix(frontend): fix pagination on mobile devices

# Documentation
docs: add API authentication guide
docs(backend): update endpoint documentation

# Refactoring
refactor(backend): extract validation to separate service
refactor: rename JobDto to JobResponse

# Chores
chore: update dependencies
chore(ci): add code coverage reporting

# Breaking changes
feat(backend)!: change ingestion response format

BREAKING CHANGE: The response now includes detailed error information per item.
```

---

## Release Process

1. Create release branch from `develop`: `release/v1.2.0`
2. Update version numbers and changelog
3. Test thoroughly
4. Merge to `main` with tag
5. Merge back to `develop`

---

## Quick Reference

```bash
# Start new feature
git checkout develop && git pull
git checkout -b feature/description

# Commit changes
git add .
git commit -m "type(scope): description"

# Push and create PR
git push origin feature/description

# After merge, cleanup
git checkout develop && git pull
git branch -d feature/description
```
