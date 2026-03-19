# JobAutomation - Arquitectura del Sistema

## Índice
1. [Flujo de Ingestión de Jobs](#1-flujo-de-ingestión-de-jobs)
2. [Arquitectura de Procesamiento](#2-arquitectura-de-procesamiento)
3. [Sistema de Scoring](#3-sistema-de-scoring)
4. [Estrategia de Almacenamiento](#4-estrategia-de-almacenamiento)
5. [Diseño de Endpoints](#5-diseño-de-endpoints)

---

## 1. Flujo de Ingestión de Jobs

### Diagrama del Flujo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Scraper   │────▶│  API POST   │────▶│  Validación │────▶│Deduplicación│────▶│   Scoring   │
│  (Node.js)  │     │  /ingest    │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │                   │                   │
                                               ▼                   ▼                   ▼
                                          [Rechazar]          [Ignorar]          [Persistir]
                                          con error           duplicado          en DB
```

### Paso a Paso

#### Step 1: Recepción de Datos
```
Scraper ──HTTP POST──▶ /api/jobs/ingest
                       Body: Array<CreateJobDto>
```
- El scraper envía un batch de jobs (recomendado: máximo 100 por request)
- Se acepta JSON con array de jobs
- Headers requeridos: `Content-Type: application/json`, opcionalmente API Key

#### Step 2: Validación (Síncrona)
```
┌────────────────────────────────────────────────────────┐
│                    VALIDACIONES                        │
├────────────────────────────────────────────────────────┤
│ 1. Campos requeridos:                                  │
│    - Title (no vacío, max 500 chars)                   │
│    - Source (identificador del scraper)                │
│    - Company.Name (no vacío)                           │
│                                                        │
│ 2. Campos opcionales con formato:                      │
│    - SourceUrl (URL válida si presente)                │
│    - ExternalId (string, max 200 chars)                │
│    - JobType, WorkMode (valores válidos del enum)      │
│                                                        │
│ 3. Sanitización:                                       │
│    - Trim de strings                                   │
│    - Normalización de URLs                             │
│    - HTML stripping en Description/Requirements        │
└────────────────────────────────────────────────────────┘
```

**Decisión**: Validación síncrona porque:
- Es rápida (< 10ms por job)
- Feedback inmediato al scraper
- Evita procesar datos inválidos

#### Step 3: Deduplicación (Síncrona)

**Estrategia de Deduplicación por Prioridad:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRITERIOS DE DUPLICADO                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nivel 1 (Exacto): ExternalId + Source                          │
│  ────────────────────────────────────────                       │
│  Si ExternalId existe → buscar por (ExternalId, Source)         │
│  Ejemplo: ("linkedin-123456", "LinkedIn")                       │
│                                                                 │
│  Nivel 2 (URL): SourceUrl normalizada                           │
│  ────────────────────────────────────────                       │
│  Si no hay ExternalId → buscar por URL normalizada              │
│  Normalización: lowercase, remove trailing slash, remove params │
│                                                                 │
│  Nivel 3 (Fuzzy): Title + Company + Location                    │
│  ────────────────────────────────────────                       │
│  Solo si no hay ExternalId ni URL                               │
│  Buscar jobs con mismo título (normalizado) + empresa           │
│  en los últimos 7 días                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Trade-off elegido:**
- ✅ Nivel 1 y 2: Siempre aplicar (rápido, preciso)
- ⚠️ Nivel 3: Solo como fallback (más costoso, puede tener falsos positivos)

```csharp
// Pseudocódigo de deduplicación
async Task<bool> IsDuplicateAsync(CreateJobDto job)
{
    // Nivel 1: ExternalId + Source (índice único)
    if (!string.IsNullOrEmpty(job.ExternalId))
        return await _repo.ExistsByExternalIdAsync(job.ExternalId, job.Source);
    
    // Nivel 2: URL normalizada
    if (!string.IsNullOrEmpty(job.SourceUrl))
        return await _repo.ExistsByNormalizedUrlAsync(NormalizeUrl(job.SourceUrl));
    
    // Nivel 3: Fuzzy match (opcional, costoso)
    return await _repo.ExistsByFuzzyMatchAsync(
        NormalizeTitle(job.Title), 
        job.Company.Name,
        DateTime.UtcNow.AddDays(-7));
}
```

#### Step 4: Scoring (Síncrono inicial, recalculable)

```
Job válido y no duplicado
         │
         ▼
┌─────────────────────┐
│  Calcular Score     │
│  (0-100)            │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Persistir Job      │
│  con Score          │
└─────────────────────┘
```

**Decisión**: Scoring síncrono porque:
- El cálculo inicial es simple (< 5ms)
- El score se necesita inmediatamente para ordenar resultados
- Se puede recalcular en background si cambian los criterios

#### Step 5: Persistencia

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRANSACCIÓN                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Buscar o crear Company                                      │
│  2. Crear Job con CompanyId                                     │
│  3. Registrar métrica de ingestión                              │
│  4. Commit                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Respuesta del Endpoint

```json
{
  "success": true,
  "data": {
    "processed": 50,
    "created": 45,
    "duplicates": 5,
    "errors": 0,
    "createdIds": ["guid1", "guid2", ...]
  }
}
```

---

## 2. Arquitectura de Procesamiento

### Decisión: Sync vs Async

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         MATRIZ DE DECISIÓN                                 │
├──────────────────────────┬─────────────┬───────────────────────────────────┤
│ Operación                │ Modo        │ Justificación                     │
├──────────────────────────┼─────────────┼───────────────────────────────────┤
│ Validación               │ SÍNCRONO    │ Rápido, feedback inmediato        │
│ Deduplicación            │ SÍNCRONO    │ Necesario antes de persistir      │
│ Scoring inicial          │ SÍNCRONO    │ Simple, < 5ms                     │
│ Persistencia             │ SÍNCRONO    │ Transaccional, respuesta al caller│
├──────────────────────────┼─────────────┼───────────────────────────────────┤
│ Re-scoring masivo        │ ASÍNCRONO   │ Puede tardar, no bloquea API      │
│ Limpieza de jobs viejos  │ ASÍNCRONO   │ Mantenimiento, scheduled          │
│ Cálculo de métricas      │ ASÍNCRONO   │ Agregaciones costosas             │
│ Notificaciones           │ ASÍNCRONO   │ No crítico, puede fallar          │
│ Enriquecimiento de datos │ ASÍNCRONO   │ APIs externas, latencia variable  │
└──────────────────────────┴─────────────┴───────────────────────────────────┘
```

### Arquitectura Recomendada (Fase 1 - Simple)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FASE 1: SIMPLE                                    │
│                     (Sin infraestructura adicional)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐      ┌──────────────┐      ┌────────────┐                    │
│   │ Scraper  │─────▶│   WebAPI     │─────▶│ PostgreSQL │                    │
│   └──────────┘      │              │      └────────────┘                    │
│                     │ ┌──────────┐ │                                        │
│                     │ │ Hosted   │ │  ◀── Background jobs con              │
│                     │ │ Service  │ │      IHostedService                    │
│                     │ └──────────┘ │                                        │
│                     └──────────────┘                                        │
│                                                                             │
│   Pros: Simple, sin dependencias externas                                   │
│   Cons: No sobrevive a reinicios, limitado en escala                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Arquitectura Futura (Fase 2 - Escalable)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASE 2: ESCALABLE                                   │
│                    (Cuando el volumen lo requiera)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐      ┌──────────────┐      ┌────────────┐                    │
│   │ Scraper  │─────▶│   WebAPI     │─────▶│ PostgreSQL │                    │
│   └──────────┘      └──────┬───────┘      └────────────┘                    │
│                            │                     ▲                          │
│                            ▼                     │                          │
│                     ┌──────────────┐      ┌──────┴─────┐                    │
│                     │    Redis     │◀────▶│  Worker    │                    │
│                     │   (Queue)    │      │  Service   │                    │
│                     └──────────────┘      └────────────┘                    │
│                                                                             │
│   Alternativas: Hangfire, MassTransit, Azure Service Bus                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementación de Background Jobs (Fase 1)

```csharp
// Usar IHostedService para tareas periódicas
public class MetricsCalculationService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CalculateMetricsAsync();
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}

// Usar Channel<T> para queue in-memory
public class JobEnrichmentQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateBounded<Guid>(1000);
    
    public async Task EnqueueAsync(Guid jobId) => await _channel.Writer.WriteAsync(jobId);
    public IAsyncEnumerable<Guid> DequeueAllAsync(CancellationToken ct) => _channel.Reader.ReadAllAsync(ct);
}
```

**Trade-off:**
- Fase 1 es suficiente para < 10,000 jobs/día
- Migrar a Fase 2 cuando se necesite: persistencia de jobs, múltiples workers, retry policies

---

## 3. Sistema de Scoring

### Diseño Extensible

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCORING ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      IScoringService                                │   │
│   │  + CalculateScoreAsync(Job job) : double                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    CompositeScoringService                          │   │
│   │  - IEnumerable<IScoringRule> _rules                                 │   │
│   │  - IUserPreferencesProvider _preferences                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│              ┌─────────────────────┼─────────────────────┐                  │
│              ▼                     ▼                     ▼                  │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│   │ CompletenessRule │  │ KeywordMatchRule │  │ WorkModeRule     │          │
│   │ (peso: 0.2)      │  │ (peso: 0.4)      │  │ (peso: 0.2)      │          │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                         │                   │
│                                              ┌──────────────────┐           │
│                                              │ SalaryRangeRule  │           │
│                                              │ (peso: 0.2)      │           │
│                                              └──────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interfaz de Reglas

```csharp
public interface IScoringRule
{
    string Name { get; }
    double Weight { get; }
    Task<double> CalculateAsync(Job job, UserPreferences? preferences);
}
```

### Reglas de Scoring

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGLAS DE SCORING                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. COMPLETENESS RULE (Peso: 20%)                                           │
│  ─────────────────────────────────                                          │
│  Evalúa qué tan completa está la información del job                        │
│                                                                             │
│  Puntos:                                                                    │
│  - Title presente: +10                                                      │
│  - Description > 100 chars: +20                                             │
│  - Requirements presente: +20                                               │
│  - Salary range presente: +20                                               │
│  - Location presente: +15                                                   │
│  - Company con website: +15                                                 │
│  Total máximo: 100                                                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  2. KEYWORD MATCH RULE (Peso: 40%)                                          │
│  ─────────────────────────────────                                          │
│  Evalúa coincidencia con keywords del usuario                               │
│                                                                             │
│  Configuración del usuario:                                                 │
│  - desired_keywords: [".NET", "C#", "Backend", "Senior"]                    │
│  - excluded_keywords: ["Junior", "Intern", "PHP"]                           │
│                                                                             │
│  Cálculo:                                                                   │
│  - Cada keyword deseado encontrado: +25 (max 100)                           │
│  - Cada keyword excluido encontrado: -50 (min 0)                            │
│  - Buscar en: Title, Description, Requirements                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  3. WORK MODE RULE (Peso: 20%)                                              │
│  ─────────────────────────────────                                          │
│  Evalúa coincidencia con preferencia de modalidad                           │
│                                                                             │
│  Configuración del usuario:                                                 │
│  - preferred_work_mode: Remote                                              │
│  - acceptable_work_modes: [Remote, Hybrid]                                  │
│                                                                             │
│  Cálculo:                                                                   │
│  - Coincide con preferred: 100                                              │
│  - Coincide con acceptable: 70                                              │
│  - No coincide: 20                                                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  4. SALARY RANGE RULE (Peso: 20%)                                           │
│  ─────────────────────────────────                                          │
│  Evalúa si el salario está en el rango deseado                              │
│                                                                             │
│  Configuración del usuario:                                                 │
│  - min_salary: 80000                                                        │
│  - preferred_salary: 120000                                                 │
│                                                                             │
│  Cálculo:                                                                   │
│  - Sin información de salario: 50 (neutral)                                 │
│  - Salario >= preferred: 100                                                │
│  - Salario >= min: 70                                                       │
│  - Salario < min: 20                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cálculo Final

```
Score Final = Σ (RuleScore × RuleWeight)

Ejemplo:
- Completeness: 80 × 0.20 = 16
- Keywords:     90 × 0.40 = 36
- WorkMode:    100 × 0.20 = 20
- Salary:       70 × 0.20 = 14
─────────────────────────────
Total:                    86
```

### Extensibilidad

Para agregar una nueva regla:

```csharp
public class CompanyReputationRule : IScoringRule
{
    public string Name => "CompanyReputation";
    public double Weight => 0.1; // Ajustar pesos de otras reglas
    
    public async Task<double> CalculateAsync(Job job, UserPreferences? prefs)
    {
        // Lógica de evaluación de reputación
        // Podría usar datos de Glassdoor, LinkedIn, etc.
    }
}

// Registro en DI
services.AddScoped<IScoringRule, CompanyReputationRule>();
```

---

## 4. Estrategia de Almacenamiento

### Qué Guardar vs Calcular

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSISTIR vs CALCULAR                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PERSISTIR (en la tabla Jobs):                                              │
│  ─────────────────────────────                                              │
│  ✓ Todos los campos del job (inmutables desde el scraper)                   │
│  ✓ RelevanceScore (calculado al ingestar, recalculable)                     │
│  ✓ Status (Active, Expired, etc.)                                           │
│  ✓ CreatedAt, UpdatedAt                                                     │
│  ✓ ExternalId, Source (para deduplicación)                                  │
│  ✓ NormalizedUrl (para deduplicación rápida)                                │
│                                                                             │
│  CALCULAR DINÁMICAMENTE:                                                    │
│  ────────────────────────                                                   │
│  ✗ Conteo de aplicaciones por job (COUNT en query)                          │
│  ✗ Días desde publicación (DATEDIFF en query)                               │
│  ✗ Estadísticas agregadas (queries de métricas)                             │
│                                                                             │
│  CACHEAR (Redis/Memory si es necesario):                                    │
│  ─────────────────────────────────────────                                  │
│  ~ Dashboard metrics (TTL: 5 min)                                           │
│  ~ Listados frecuentes (TTL: 1 min)                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Esquema de Base de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHEMA PRINCIPAL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Companies                          Jobs                                    │
│  ──────────                         ────                                    │
│  PK: Id (GUID)                      PK: Id (GUID)                           │
│  Name (varchar 300) UNIQUE          FK: CompanyId                           │
│  Website (varchar 500)              Title (varchar 500)                     │
│  Industry (varchar 200)             Description (text)                      │
│  Location (varchar 200)             Requirements (text)                     │
│  LogoUrl (varchar 1000)             Location (varchar 200)                  │
│  Description (text)                 JobType (varchar 50)                    │
│  CreatedAt                          WorkMode (varchar 50)                   │
│  UpdatedAt                          SalaryRange (varchar 100)               │
│                                     ExternalId (varchar 200)                │
│         │                           SourceUrl (varchar 1000)                │
│         │                           NormalizedUrl (varchar 1000)            │
│         │                           Source (varchar 100)                    │
│         │                           Status (varchar 50)                     │
│         │                           RelevanceScore (decimal)                │
│         │                           ExpiresAt (timestamp)                   │
│         │                           CreatedAt                               │
│         └──────────────────────────▶UpdatedAt                               │
│                                                                             │
│                                            │                                │
│                                            │                                │
│                                            ▼                                │
│                                     Applications                            │
│                                     ────────────                            │
│                                     PK: Id (GUID)                           │
│                                     FK: JobId                               │
│                                     Status (varchar 50)                     │
│                                     AppliedAt (timestamp)                   │
│                                     CoverLetter (text)                      │
│                                     ResumeUrl (varchar 1000)                │
│                                     Notes (text)                            │
│                                     ResponseDate (timestamp)                │
│                                     InterviewDate (timestamp)               │
│                                     CreatedAt                               │
│                                     UpdatedAt                               │
│                                                                             │
│  Metrics                                                                    │
│  ───────                                                                    │
│  PK: Id (GUID)                                                              │
│  Type (varchar 50)                                                          │
│  Name (varchar 200)                                                         │
│  Value (decimal)                                                            │
│  RecordedAt (timestamp)                                                     │
│  Metadata (jsonb)                                                           │
│  CreatedAt                                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Índices Necesarios

```sql
-- Jobs: Búsqueda y filtrado
CREATE INDEX IX_Jobs_Status ON Jobs(Status);
CREATE INDEX IX_Jobs_RelevanceScore ON Jobs(RelevanceScore DESC);
CREATE INDEX IX_Jobs_CreatedAt ON Jobs(CreatedAt DESC);
CREATE INDEX IX_Jobs_CompanyId ON Jobs(CompanyId);
CREATE INDEX IX_Jobs_Source ON Jobs(Source);

-- Jobs: Deduplicación (CRÍTICOS)
CREATE UNIQUE INDEX IX_Jobs_ExternalId_Source ON Jobs(ExternalId, Source) 
    WHERE ExternalId IS NOT NULL;
CREATE INDEX IX_Jobs_NormalizedUrl ON Jobs(NormalizedUrl) 
    WHERE NormalizedUrl IS NOT NULL;

-- Jobs: Búsqueda full-text (PostgreSQL)
CREATE INDEX IX_Jobs_Title_FTS ON Jobs USING gin(to_tsvector('english', Title));
CREATE INDEX IX_Jobs_Description_FTS ON Jobs USING gin(to_tsvector('english', Description));

-- Applications: Consultas frecuentes
CREATE INDEX IX_Applications_Status ON Applications(Status);
CREATE INDEX IX_Applications_JobId ON Applications(JobId);
CREATE INDEX IX_Applications_AppliedAt ON Applications(AppliedAt DESC);

-- Companies
CREATE UNIQUE INDEX IX_Companies_Name ON Companies(LOWER(Name));

-- Metrics
CREATE INDEX IX_Metrics_Type ON Metrics(Type);
CREATE INDEX IX_Metrics_RecordedAt ON Metrics(RecordedAt DESC);
```

### Consideraciones de Performance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTIMIZACIONES                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PAGINACIÓN                                                              │
│     - Usar keyset pagination para listados grandes                          │
│     - Evitar OFFSET con valores altos                                       │
│                                                                             │
│     -- En lugar de:                                                         │
│     SELECT * FROM Jobs ORDER BY CreatedAt DESC OFFSET 10000 LIMIT 20;       │
│                                                                             │
│     -- Usar:                                                                │
│     SELECT * FROM Jobs                                                      │
│     WHERE CreatedAt < @lastCreatedAt                                        │
│     ORDER BY CreatedAt DESC LIMIT 20;                                       │
│                                                                             │
│  2. QUERIES FRECUENTES                                                      │
│     - Materializar conteos si son muy frecuentes                            │
│     - Usar covering indexes para queries de listado                         │
│                                                                             │
│  3. LIMPIEZA                                                                │
│     - Archivar jobs > 90 días a tabla histórica                             │
│     - Soft delete para mantener referencias                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Diseño de Endpoints

### Endpoint: Ingestión de Jobs

```
POST /api/jobs/ingest
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REQUEST                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Headers:                                                                   │
│    Content-Type: application/json                                           │
│    X-Api-Key: {scraper-api-key}  (opcional, para autenticar scrapers)       │
│                                                                             │
│  Body:                                                                      │
│  [                                                                          │
│    {                                                                        │
│      "title": "Senior .NET Developer",                                      │
│      "description": "We are looking for...",                                │
│      "requirements": "5+ years experience...",                              │
│      "location": "Remote - US",                                             │
│      "jobType": "FullTime",                                                 │
│      "workMode": "Remote",                                                  │
│      "salaryRange": "$120k - $150k",                                        │
│      "externalId": "linkedin-123456",                                       │
│      "sourceUrl": "https://linkedin.com/jobs/view/123456",                  │
│      "source": "LinkedIn",                                                  │
│      "expiresAt": "2024-04-01T00:00:00Z",                                   │
│      "company": {                                                           │
│        "name": "Tech Corp",                                                 │
│        "website": "https://techcorp.com",                                   │
│        "industry": "Technology"                                             │
│      }                                                                      │
│    }                                                                        │
│  ]                                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  RESPONSE (200 OK)                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "success": true,                                                         │
│    "data": {                                                                │
│      "processed": 50,                                                       │
│      "created": 45,                                                         │
│      "duplicates": 4,                                                       │
│      "invalid": 1,                                                          │
│      "createdIds": ["guid1", "guid2", ...],                                 │
│      "errors": [                                                            │
│        { "index": 23, "error": "Title is required" }                        │
│      ]                                                                      │
│    },                                                                       │
│    "message": "45 jobs ingested successfully"                               │
│  }                                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  RESPONSE (400 Bad Request)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "success": false,                                                        │
│    "message": "Invalid request",                                            │
│    "errors": ["Request body cannot be empty"]                               │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Endpoint: Consulta con Filtros

```
GET /api/jobs
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  QUERY PARAMETERS                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  keyword         string    Búsqueda en título, descripción, empresa         │
│  jobType         enum      FullTime, PartTime, Contract, Freelance          │
│  workMode        enum      Remote, OnSite, Hybrid                           │
│  location        string    Filtro por ubicación (contains)                  │
│  status          enum      Active, Expired, Filled, Closed                  │
│  minScore        double    Score mínimo de relevancia (0-100)               │
│  source          string    Filtrar por fuente (LinkedIn, Indeed, etc.)      │
│  companyId       guid      Filtrar por empresa                              │
│  fromDate        datetime  Jobs creados desde esta fecha                    │
│  page            int       Número de página (default: 1)                    │
│  pageSize        int       Items por página (default: 20, max: 100)         │
│  sortBy          string    Campo de ordenamiento (default: relevanceScore)  │
│  sortDir         string    asc | desc (default: desc)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  EJEMPLO                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  GET /api/jobs?keyword=.NET&workMode=Remote&minScore=70&page=1&pageSize=20  │
├─────────────────────────────────────────────────────────────────────────────┤
│  RESPONSE (200 OK)                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "success": true,                                                         │
│    "data": {                                                                │
│      "items": [                                                             │
│        {                                                                    │
│          "id": "guid",                                                      │
│          "title": "Senior .NET Developer",                                  │
│          "location": "Remote",                                              │
│          "jobType": "FullTime",                                             │
│          "workMode": "Remote",                                              │
│          "salaryRange": "$120k - $150k",                                    │
│          "status": "Active",                                                │
│          "relevanceScore": 85.5,                                            │
│          "createdAt": "2024-01-15T10:30:00Z",                               │
│          "companyName": "Tech Corp"                                         │
│        }                                                                    │
│      ],                                                                     │
│      "totalCount": 150,                                                     │
│      "page": 1,                                                             │
│      "pageSize": 20,                                                        │
│      "totalPages": 8,                                                       │
│      "hasNextPage": true,                                                   │
│      "hasPreviousPage": false                                               │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Endpoint: Aplicar a Job

```
POST /api/applications
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REQUEST                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "jobId": "guid",                                                         │
│    "coverLetter": "Dear Hiring Manager...",                                 │
│    "resumeUrl": "https://storage.example.com/resume.pdf",                   │
│    "notes": "Applied via company website"                                   │
│  }                                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  VALIDACIONES                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Job debe existir                                                        │
│  2. Job debe estar activo (Status = Active)                                 │
│  3. No debe existir aplicación previa al mismo job                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  RESPONSE (201 Created)                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "success": true,                                                         │
│    "data": {                                                                │
│      "id": "guid",                                                          │
│      "jobId": "guid",                                                       │
│      "jobTitle": "Senior .NET Developer",                                   │
│      "companyName": "Tech Corp",                                            │
│      "status": "Applied",                                                   │
│      "appliedAt": "2024-01-15T14:30:00Z"                                    │
│    },                                                                       │
│    "message": "Application submitted successfully"                          │
│  }                                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  RESPONSE (400 Bad Request) - Ya aplicado                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "success": false,                                                        │
│    "message": "You have already applied to this job"                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Endpoint: Actualizar Estado de Aplicación

```
PATCH /api/applications/{id}/status
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REQUEST                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "status": "Interview",                                                   │
│    "notes": "Phone screening scheduled",                                    │
│    "interviewDate": "2024-01-20T15:00:00Z"                                  │
│  }                                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  STATUS TRANSITIONS VÁLIDAS                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Pending ──▶ Applied ──▶ InReview ──▶ Interview ──▶ Offered ──▶ Accepted   │
│     │           │            │            │            │                    │
│     │           │            │            │            └──▶ Rejected        │
│     │           │            │            └──▶ Rejected                     │
│     │           │            └──▶ Rejected                                  │
│     │           └──▶ Rejected                                               │
│     └──▶ Withdrawn                                                          │
│                                                                             │
│  Cualquier estado ──▶ Withdrawn (el usuario puede retirarse)                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  RESPONSE (200 OK)                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                          │
│    "success": true,                                                         │
│    "data": {                                                                │
│      "id": "guid",                                                          │
│      "status": "Interview",                                                 │
│      "interviewDate": "2024-01-20T15:00:00Z",                               │
│      "notes": "Phone screening scheduled"                                   │
│    },                                                                       │
│    "message": "Application status updated"                                  │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumen de Decisiones Clave

| Decisión | Opción Elegida | Justificación |
|----------|----------------|---------------|
| Validación | Síncrona | Feedback inmediato, < 10ms |
| Deduplicación | ExternalId+Source primero | Más preciso, índice único |
| Scoring inicial | Síncrono | Simple, necesario para ordenar |
| Background jobs | IHostedService (Fase 1) | Sin dependencias, suficiente para MVP |
| Scoring extensible | Strategy pattern con reglas | Fácil agregar/modificar reglas |
| Paginación | Keyset para listados grandes | Mejor performance que OFFSET |
| Almacenamiento score | Persistido, recalculable | Balance entre performance y flexibilidad |

---

## Próximos Pasos Sugeridos

1. **Implementar validación con FluentValidation**
2. **Agregar campo NormalizedUrl a Job entity**
3. **Crear UserPreferences entity para scoring personalizado**
4. **Implementar CompositeScoringService con reglas**
5. **Agregar endpoint de re-scoring masivo**
6. **Configurar migraciones de EF Core con índices**
