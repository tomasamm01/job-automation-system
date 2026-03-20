# Quick Start - API Integration

## 🚀 Setup Rápido

### 1. Configurar Variables de Entorno

Crea `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 2. Ya está todo configurado ✅

El `QueryProvider` ya está en `main.tsx` y todos los hooks están listos para usar.

## 📋 Código Listo para Copiar

### Job Dashboard con Filtros

```typescript
import { useState } from 'react';
import { useJobs } from '@/hooks';
import { QueryStateHandler } from '@/components/ui';
import type { JobFilters } from '@/types';

export function JobDashboard() {
  const [filters, setFilters] = useState<JobFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading, isError, error, refetch } = useJobs(filters);

  return (
    <QueryStateHandler
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      isEmpty={(data) => data.items.length === 0}
      emptyTitle="No jobs found"
      onRetry={() => refetch()}
    >
      {(pagedData) => (
        <div className="space-y-4">
          {pagedData.items.map(job => (
            <div key={job.id} className="p-4 border rounded">
              <h3 className="font-semibold">{job.title}</h3>
              <p className="text-gray-600">{job.companyName}</p>
              <span>Score: {job.relevanceScore}%</span>
            </div>
          ))}
        </div>
      )}
    </QueryStateHandler>
  );
}
```

### Application Tracker

```typescript
import { useApplications, useUpdateApplicationStatus } from '@/hooks';
import { QueryStateHandler } from '@/components/ui';
import type { ApplicationStatus } from '@/types';

export function ApplicationTracker() {
  const { data, isLoading, isError, error, refetch } = useApplications();
  const updateStatus = useUpdateApplicationStatus();

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await updateStatus.mutateAsync({ id, dto: { status } });
  };

  return (
    <QueryStateHandler
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      isEmpty={(data) => data.length === 0}
      emptyTitle="No applications yet"
      onRetry={() => refetch()}
    >
      {(applications) => (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="p-4 border rounded">
              <h3>{app.jobTitle}</h3>
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                disabled={updateStatus.isPending}
                className="mt-2 px-3 py-1 border rounded"
              >
                <option value="Pending">Pending</option>
                <option value="Applied">Applied</option>
                <option value="InReview">In Review</option>
                <option value="Interview">Interview</option>
                <option value="Offered">Offered</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </QueryStateHandler>
  );
}
```

### Botón Apply

```typescript
import { useCreateApplication } from '@/hooks';

export function ApplyButton({ jobId }: { jobId: string }) {
  const createApp = useCreateApplication();

  const handleApply = async () => {
    try {
      await createApp.mutateAsync({
        jobId,
        coverLetter: 'I am very interested in this position...',
      });
      alert('Application submitted!');
    } catch (error) {
      alert('Failed to apply');
    }
  };

  return (
    <button
      onClick={handleApply}
      disabled={createApp.isPending}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {createApp.isPending ? 'Applying...' : 'Apply Now'}
    </button>
  );
}
```

### Dashboard con Métricas

```typescript
import { useMetrics } from '@/hooks';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';

export function MetricsDashboard() {
  const { data: metrics, isLoading, isError, error } = useMetrics();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error.message} />;
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard title="Total Jobs" value={metrics.totalJobs} />
      <MetricCard title="Applications" value={metrics.totalApplications} />
      <MetricCard title="Response Rate" value={`${metrics.responseRate}%`} />
      <MetricCard title="Interviews" value={metrics.interviewsScheduled} />
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 border rounded">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
```

## 🎣 Todos los Hooks Disponibles

```typescript
// Jobs
import { useJobs, useJob } from '@/hooks';
const { data, isLoading, error } = useJobs(filters);
const { data: job } = useJob(jobId);

// Applications
import { 
  useApplications, 
  useApplication,
  useCreateApplication,
  useUpdateApplicationStatus 
} from '@/hooks';

const { data: apps } = useApplications();
const { data: app } = useApplication(appId);
const createApp = useCreateApplication();
const updateStatus = useUpdateApplicationStatus();

// Métricas
import { useMetrics } from '@/hooks';
const { data: metrics } = useMetrics();
```

## 🎨 Componentes UI

```typescript
import { 
  QueryStateHandler,
  LoadingSpinner,
  ErrorMessage,
  EmptyState 
} from '@/components/ui';

// Manejo completo de estados
<QueryStateHandler {...queryProps}>
  {(data) => <YourComponent data={data} />}
</QueryStateHandler>

// Loading individual
<LoadingSpinner size="md" message="Loading..." />

// Error individual
<ErrorMessage message="Error" onRetry={() => refetch()} />

// Estado vacío
<EmptyState title="No data" description="Try again later" />
```

## 🔧 API Directa (sin hooks)

```typescript
import { jobsApi, applicationsApi, metricsApi } from '@/services/api';

// Si necesitas llamar la API directamente
const jobs = await jobsApi.getJobs({ keyword: 'React' });
const app = await applicationsApi.createApplication({ jobId: '123' });
const metrics = await metricsApi.getDashboardMetrics();
```

## 📝 Tipos TypeScript

```typescript
import type {
  Job,
  JobListItem,
  Application,
  ApplicationStatus,
  JobFilters,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  DashboardMetrics,
  PagedResult
} from '@/types';
```

## ⚡ Tips Rápidos

### Filtros Dinámicos
```typescript
const [filters, setFilters] = useState<JobFilters>({});
const { data } = useJobs(filters);

// Actualizar filtros
setFilters(prev => ({ ...prev, keyword: 'React', page: 1 }));
```

### Refetch Manual
```typescript
const { data, refetch } = useJobs();
<button onClick={() => refetch()}>Refresh</button>
```

### Invalidar Cache
```typescript
import { queryClient } from '@/lib/queryClient';
queryClient.invalidateQueries({ queryKey: ['jobs'] });
```

### Mutation con Feedback
```typescript
const createApp = useCreateApplication();

const handleApply = async () => {
  try {
    await createApp.mutateAsync({ jobId });
    // Success
  } catch (error) {
    // Error
  }
};

// Estados: createApp.isPending, createApp.isError, createApp.error
```

## 📂 Archivos Importantes

- **API Layer**: `src/services/api.ts`
- **Hooks**: `src/hooks/useJobs.ts`, `useApplications.ts`, `useMetrics.ts`
- **Config**: `src/config/env.ts`
- **Provider**: `src/providers/QueryProvider.tsx`
- **Ejemplos**: `src/components/examples/`

## 🎯 Próximos Pasos

1. Crea tu `.env` con `VITE_API_BASE_URL`
2. Copia los ejemplos de arriba
3. Personaliza según tus necesidades
4. Ver documentación completa en `API_INTEGRATION_GUIDE.md`
