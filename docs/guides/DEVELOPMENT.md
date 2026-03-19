# Development Guide

This guide covers local development setup and common workflows.

## Prerequisites

| Component | Requirement |
|-----------|-------------|
| Backend | .NET 8 SDK |
| Database | PostgreSQL 14+ |
| Frontend | Node.js 20+, npm |
| Scraper | Node.js 20+ |

---

## Backend Development

### Initial Setup

```bash
cd backend

# Restore dependencies
dotnet restore

# Configure database (edit appsettings.json or use user secrets)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=jobautomation;Username=postgres;Password=yourpassword"

# Apply migrations
dotnet ef database update --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI

# Run the API
dotnet run --project src/JobAutomation.WebAPI
```

### Running Tests

```bash
cd backend

# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test project
dotnet test tests/JobAutomation.Core.Tests
```

### Adding Migrations

```bash
cd backend

# Create migration
dotnet ef migrations add <MigrationName> --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI

# Apply migration
dotnet ef database update --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI

# Revert last migration
dotnet ef migrations remove --project src/JobAutomation.Infrastructure --startup-project src/JobAutomation.WebAPI
```

### API Documentation

Swagger UI is available at `https://localhost:5001/swagger` when running in Development mode.

---

## Database

### Local PostgreSQL Setup

```bash
# Using Docker
docker run --name jobautomation-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobautomation -p 5432:5432 -d postgres:14

# Connect
psql -h localhost -U postgres -d jobautomation
```

### Connection String Format

```
Host=localhost;Port=5432;Database=jobautomation;Username=postgres;Password=yourpassword
```

---

## Common Tasks

### Testing the Ingestion Endpoint

```bash
curl -X POST https://localhost:5001/api/jobs/ingest \
  -H "Content-Type: application/json" \
  -d '[{
    "title": "Senior .NET Developer",
    "description": "Looking for experienced developer...",
    "source": "Manual",
    "externalId": "test-001",
    "company": {
      "name": "Test Company"
    }
  }]'
```

### Viewing Logs

Logs are written to console by default. Configure structured logging in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

---

## IDE Setup

### Visual Studio / Rider

- Open `backend/JobAutomation.sln`
- Set `JobAutomation.WebAPI` as startup project

### VS Code

Recommended extensions:
- C# Dev Kit
- REST Client
- PostgreSQL

---

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check connection string in appsettings.json
3. Ensure database exists: `CREATE DATABASE jobautomation;`

### Migration Errors

1. Ensure you're in the `backend` directory
2. Check that Infrastructure project references are correct
3. Try removing and recreating the migration

### Port Already in Use

```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill process (Windows)
taskkill /PID <pid> /F
```
