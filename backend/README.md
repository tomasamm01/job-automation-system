# JobAutomation Backend

Backend API para el sistema de automatización de gestión de oportunidades laborales, desarrollado en **.NET 8** siguiendo **Clean Architecture**.

## Estructura del Proyecto

```
backend/
├── src/
│   ├── JobAutomation.Core/           # Dominio y lógica de negocio
│   │   ├── DTOs/                     # Data Transfer Objects
│   │   ├── Entities/                 # Entidades del dominio
│   │   ├── Enums/                    # Enumeraciones
│   │   ├── Exceptions/               # Excepciones personalizadas
│   │   ├── Interfaces/               # Contratos (repositorios, servicios)
│   │   └── UseCases/                 # Casos de uso (Application layer)
│   │
│   ├── JobAutomation.Infrastructure/ # Implementaciones de infraestructura
│   │   ├── Data/                     # DbContext y configuraciones EF
│   │   ├── Repositories/             # Implementación de repositorios
│   │   └── Services/                 # Servicios de dominio
│   │
│   └── JobAutomation.WebAPI/         # API REST
│       ├── Controllers/              # Endpoints
│       └── Middleware/               # Middleware personalizado
│
└── tests/                            # Tests unitarios e integración
```

## Requisitos

- .NET 8 SDK
- PostgreSQL 14+

## Configuración

1. **Clonar el repositorio**

2. **Configurar la base de datos** en `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=jobautomation;Username=postgres;Password=postgres"
  }
}
```

3. **Aplicar migraciones**:
```bash
cd src/JobAutomation.WebAPI
dotnet ef migrations add InitialCreate --project ../JobAutomation.Infrastructure
dotnet ef database update
```

4. **Ejecutar la API**:
```bash
dotnet run --project src/JobAutomation.WebAPI
```

## Endpoints Principales

### Jobs
- `GET /api/jobs` - Listar jobs con filtros
- `GET /api/jobs/{id}` - Obtener job por ID
- `POST /api/jobs/ingest` - Ingestar jobs desde scraper

### Applications
- `GET /api/applications` - Listar aplicaciones
- `GET /api/applications/{id}` - Obtener aplicación por ID
- `POST /api/applications` - Aplicar a un job
- `PATCH /api/applications/{id}/status` - Actualizar estado

### Metrics
- `GET /api/metrics/dashboard` - Obtener métricas del dashboard

## Ejemplo de Ingesta de Jobs

```json
POST /api/jobs/ingest
[
  {
    "title": "Senior .NET Developer",
    "description": "Buscamos desarrollador senior...",
    "requirements": "5+ años de experiencia...",
    "location": "Remote",
    "jobType": "FullTime",
    "workMode": "Remote",
    "salaryRange": "$80k - $120k",
    "externalId": "linkedin-123456",
    "sourceUrl": "https://linkedin.com/jobs/123456",
    "source": "LinkedIn",
    "company": {
      "name": "Tech Company",
      "website": "https://techcompany.com",
      "industry": "Technology"
    }
  }
]
```

## Arquitectura

El proyecto sigue **Clean Architecture** con las siguientes capas:

- **Core**: Entidades, interfaces, DTOs y casos de uso. Sin dependencias externas.
- **Infrastructure**: Implementaciones de EF Core, repositorios y servicios.
- **WebAPI**: Controllers, middleware y configuración de la aplicación.

## Características

- ✅ Clean Architecture
- ✅ Entity Framework Core con PostgreSQL
- ✅ Patrón Repository + Unit of Work
- ✅ Casos de uso desacoplados
- ✅ DTOs con records inmutables
- ✅ Middleware de manejo de errores
- ✅ Configuración JWT (preparado)
- ✅ Swagger/OpenAPI
- ✅ CORS configurado
