# Optimización de Ingestión a Gran Escala

## Estrategias Implementadas

### 1. Batch Deduplication (Actual)
```
Flujo actual:
1. Validar todos los jobs en memoria (O(n))
2. Consultar ExternalIds existentes en batch (1 query)
3. Consultar NormalizedUrls existentes en batch (1 query)
4. Filtrar duplicados en memoria con HashSet (O(1) lookup)
5. Crear jobs no duplicados
```

**Complejidad**: O(n) + 2 queries SQL
**Escala**: Funciona bien hasta ~10,000 jobs/batch

---

## Optimizaciones para Mayor Escala

### 2. Bloom Filter para Pre-filtrado (>100k jobs/día)

```csharp
public class JobDeduplicationCache
{
    private readonly BloomFilter<string> _externalIdFilter;
    private readonly BloomFilter<string> _urlFilter;
    
    public JobDeduplicationCache(int expectedItems = 1_000_000, double falsePositiveRate = 0.01)
    {
        _externalIdFilter = new BloomFilter<string>(expectedItems, falsePositiveRate);
        _urlFilter = new BloomFilter<string>(expectedItems, falsePositiveRate);
    }
    
    public bool MightExist(string externalId, string source)
    {
        return _externalIdFilter.Contains($"{externalId}|{source}");
    }
    
    public bool MightExistByUrl(string normalizedUrl)
    {
        return _urlFilter.Contains(normalizedUrl);
    }
}
```

**Ventaja**: Reduce queries a DB en ~99% para items nuevos
**Trade-off**: Falsos positivos requieren verificación en DB

### 3. Redis Cache para Deduplicación Distribuida

```csharp
public class RedisDeduplicationService
{
    private readonly IConnectionMultiplexer _redis;
    private const string ExternalIdSetKey = "jobs:externalids";
    private const string UrlSetKey = "jobs:urls";
    
    public async Task<bool> ExistsAsync(string externalId, string source)
    {
        var db = _redis.GetDatabase();
        return await db.SetContainsAsync(ExternalIdSetKey, $"{externalId}|{source}");
    }
    
    public async Task<long> FilterExistingAsync(IEnumerable<string> keys)
    {
        var db = _redis.GetDatabase();
        var batch = db.CreateBatch();
        var tasks = keys.Select(k => batch.SetContainsAsync(ExternalIdSetKey, k)).ToList();
        batch.Execute();
        var results = await Task.WhenAll(tasks);
        return results.Count(r => r);
    }
}
```

**Ventaja**: O(1) lookups, compartido entre instancias
**Trade-off**: Requiere sincronización con DB

### 4. Particionamiento por Source

```sql
-- Tabla particionada por source
CREATE TABLE jobs (
    id UUID,
    external_id VARCHAR(200),
    source VARCHAR(100),
    ...
) PARTITION BY LIST (source);

CREATE TABLE jobs_linkedin PARTITION OF jobs FOR VALUES IN ('LinkedIn');
CREATE TABLE jobs_indeed PARTITION OF jobs FOR VALUES IN ('Indeed');
CREATE TABLE jobs_glassdoor PARTITION OF jobs FOR VALUES IN ('Glassdoor');
```

**Ventaja**: Queries de deduplicación más rápidas por partición
**Trade-off**: Complejidad de mantenimiento

### 5. Procesamiento Asíncrono con Queue

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Scraper  │────▶│  Queue   │────▶│ Worker   │────▶│    DB    │
│          │     │ (Redis)  │     │ (N inst) │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
              Dedup en memoria
              antes de encolar
```

```csharp
public class JobIngestionQueue
{
    private readonly Channel<CreateJobDto> _channel;
    private readonly HashSet<string> _recentExternalIds = new();
    private readonly object _lock = new();
    
    public async Task<bool> TryEnqueueAsync(CreateJobDto job)
    {
        var key = $"{job.ExternalId}|{job.Source}";
        
        lock (_lock)
        {
            if (_recentExternalIds.Contains(key))
                return false;
            _recentExternalIds.Add(key);
        }
        
        await _channel.Writer.WriteAsync(job);
        return true;
    }
}
```

---

## Índices Recomendados para Escala

```sql
-- Índice parcial para deduplicación rápida
CREATE INDEX CONCURRENTLY ix_jobs_dedup_externalid 
ON jobs (external_id, source) 
WHERE external_id IS NOT NULL;

-- Índice hash para lookups exactos (PostgreSQL)
CREATE INDEX CONCURRENTLY ix_jobs_normalized_url_hash 
ON jobs USING hash (normalized_url) 
WHERE normalized_url IS NOT NULL;

-- Índice BRIN para rangos de fecha (tablas grandes)
CREATE INDEX CONCURRENTLY ix_jobs_created_brin 
ON jobs USING brin (created_at);
```

---

## Métricas de Performance Esperadas

| Escala | Estrategia | Latencia p99 | Throughput |
|--------|------------|--------------|------------|
| < 1k/día | Batch SQL | < 100ms | 500 jobs/s |
| 1k-10k/día | Batch SQL + índices | < 200ms | 300 jobs/s |
| 10k-100k/día | Redis cache | < 50ms | 1000 jobs/s |
| > 100k/día | Bloom + Redis + Queue | < 20ms | 5000 jobs/s |

---

## Recomendación por Fase

1. **MVP (actual)**: Batch SQL con índices - suficiente para < 10k jobs/día
2. **Crecimiento**: Agregar Redis cache para deduplicación
3. **Escala**: Implementar queue + workers + Bloom filter
