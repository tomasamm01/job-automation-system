# Guía de Integración API - Frontend

Esta guía explica cómo usar la capa de API profesional implementada en el frontend.

## 📁 Estructura

```
src/
├── config/
│   └── env.ts                    # Configuración de entorno
├── services/
│   └── api.ts                    # Capa de API centralizada
├── hooks/
│   ├── useJobs.ts               # Hooks para jobs
│   ├── useApplications.ts       # Hooks para applications
│   └── useMetrics.ts            # Hooks para métricas
├── providers/
│   └── QueryProvider.tsx        # Provider de React Query
├── lib/
│   └── queryClient.ts           # Configuración de QueryClient
└── components/
    ├── ui/
    │   ├── QueryStateHandler.tsx # Manejo de estados
    │   ├── LoadingSpinner.tsx    # Spinner de carga
    │   └── ErrorMessage.tsx      # Mensajes de error
    └── examples/
        ├── JobDashboardExample.tsx
        ├── ApplicationTrackerExample.tsx
        └── ApplyToJobExample.tsx
```

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del frontend:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 2. Provider Setup

El `QueryProvider` ya está configurado en `main.tsx`:

```tsx
import { QueryProvider } from '@/providers/QueryProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>
);
```

## 📡 Capa de API

### Endpoints Disponibles

#### Jobs API

```typescript
import { jobsApi } from '@/services/api';

// Obtener lista de jobs con filtros
const jobs = await jobsApi.getJobs({
  keyword: 'React',
  workMode: 'Remote',
  minRelevanceScore: 70,
  page: 1,
  pageSize: 20
});

// Obtener un job específico
const job = await jobsApi.getJob('job-id');
```

#### Applications API

```typescript
import { applicationsApi } from '@/services/api';

// Listar aplicaciones
const applications = await applicationsApi.getApplications();
const filteredApps = await applicationsApi.getApplications('Applied');

// Obtener una aplicación
const app = await applicationsApi.getApplication('app-id');

// Crear aplicación
const newApp = await applicationsApi.createApplication({
  jobId: 'job-id',
  coverLetter: 'My cover letter...',
  notes: 'Personal notes'
});

// Actualizar estado
const updated = await applicationsApi.updateStatus('app-id', {
  status: 'Interview',
  interviewDate: '2024-03-25T10:00:00Z'
});
```

#### Metrics API

```typescript
import { metricsApi } from '@/services/api';

const metrics = await metricsApi.getDashboardMetrics();
```

### Manejo de Errores

La API lanza `ApiError` con información detallada:

```typescript
import { ApiError } from '@/services/api';

try {
  await jobsApi.getJobs();
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.message);      // Mensaje de error
    console.log(error.statusCode);   // Código HTTP
    console.log(error.errors);       // Array de errores
  }
}
```

## 🎣 React Query Hooks

### useJobs

```typescript
import { useJobs } from '@/hooks';

function JobList() {
  const { data, isLoading, isError, error, refetch } = useJobs({
    keyword: 'React',
    workMode: 'Remote',
    page: 1,
    pageSize: 20
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {data.items.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### useJob (Single Job)

```typescript
import { useJob } from '@/hooks';

function JobDetail({ jobId }: { jobId: string }) {
  const { data: job, isLoading } = useJob(jobId);

  if (isLoading) return <LoadingSpinner />;
  if (!job) return null;

  return <div>{job.title}</div>;
}
```

### useApplications

```typescript
import { useApplications } from '@/hooks';

function ApplicationList() {
  const { data, isLoading, refetch } = useApplications();
  
  // Con filtro de estado
  const { data: pending } = useApplications('Pending');

  return (
    <div>
      {data?.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}
```

### useCreateApplication (Mutation)

```typescript
import { useCreateApplication } from '@/hooks';

function ApplyButton({ jobId }: { jobId: string }) {
  const createApp = useCreateApplication();

  const handleApply = async () => {
    try {
      await createApp.mutateAsync({
        jobId,
        coverLetter: 'My cover letter'
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
    >
      {createApp.isPending ? 'Applying...' : 'Apply Now'}
    </button>
  );
}
```

### useUpdateApplicationStatus (Mutation)

```typescript
import { useUpdateApplicationStatus } from '@/hooks';

function StatusSelector({ appId, currentStatus }) {
  const updateStatus = useUpdateApplicationStatus();

  const handleChange = async (newStatus) => {
    await updateStatus.mutateAsync({
      id: appId,
      dto: { status: newStatus }
    });
  };

  return (
    <select 
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      disabled={updateStatus.isPending}
    >
      <option value="Pending">Pending</option>
      <option value="Applied">Applied</option>
      <option value="Interview">Interview</option>
    </select>
  );
}
```

### useMetrics

```typescript
import { useMetrics } from '@/hooks';

function Dashboard() {
  const { data: metrics, isLoading } = useMetrics();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <p>Total Jobs: {metrics.totalJobs}</p>
      <p>Total Applications: {metrics.totalApplications}</p>
      <p>Response Rate: {metrics.responseRate}%</p>
    </div>
  );
}
```

## 🎨 Componentes de Utilidad

### QueryStateHandler

Maneja todos los estados de una query de forma centralizada:

```typescript
import { QueryStateHandler } from '@/components/ui';
import { useJobs } from '@/hooks';

function JobList() {
  const { data, isLoading, isError, error, refetch } = useJobs();

  return (
    <QueryStateHandler
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      isEmpty={(data) => data.items.length === 0}
      loadingMessage="Loading jobs..."
      emptyTitle="No jobs found"
      emptyDescription="Try adjusting your filters"
      onRetry={() => refetch()}
    >
      {(pagedData) => (
        <div>
          {pagedData.items.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </QueryStateHandler>
  );
}
```

### LoadingSpinner

```typescript
import { LoadingSpinner } from '@/components/ui';

<LoadingSpinner size="md" message="Loading..." />
```

### ErrorMessage

```typescript
import { ErrorMessage } from '@/components/ui';

<ErrorMessage 
  title="Error"
  message="Failed to load data"
  onRetry={() => refetch()}
/>
```

## 📝 Ejemplos Completos

### Job Dashboard con Filtros

```typescript
import { useState } from 'react';
import { useJobs } from '@/hooks';
import { QueryStateHandler } from '@/components/ui';

function JobDashboard() {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, isError, error, refetch } = useJobs(filters);

  const handleSearch = (keyword: string) => {
    setFilters(prev => ({ ...prev, keyword, page: 1 }));
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Search jobs..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      <QueryStateHandler
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        isEmpty={(data) => data.items.length === 0}
        onRetry={() => refetch()}
      >
        {(pagedData) => (
          <>
            {pagedData.items.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
            <Pagination 
              page={pagedData.page}
              totalPages={pagedData.totalPages}
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
            />
          </>
        )}
      </QueryStateHandler>
    </div>
  );
}
```

### Application Tracker con Actualización de Estado

```typescript
import { useApplications, useUpdateApplicationStatus } from '@/hooks';
import { QueryStateHandler } from '@/components/ui';

function ApplicationTracker() {
  const { data, isLoading, isError, error, refetch } = useApplications();
  const updateStatus = useUpdateApplicationStatus();

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus.mutateAsync({ id, dto: { status } });
  };

  return (
    <QueryStateHandler
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      isEmpty={(data) => data.length === 0}
      onRetry={() => refetch()}
    >
      {(applications) => (
        <div>
          {applications.map(app => (
            <div key={app.id}>
              <h3>{app.jobTitle}</h3>
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                disabled={updateStatus.isPending}
              >
                <option value="Pending">Pending</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </QueryStateHandler>
  );
}
```

### Botón Apply con Modal

```typescript
import { useState } from 'react';
import { useCreateApplication } from '@/hooks';

function ApplyButton({ jobId }: { jobId: string }) {
  const [showModal, setShowModal] = useState(false);
  const createApp = useCreateApplication();

  const handleSubmit = async (coverLetter: string) => {
    try {
      await createApp.mutateAsync({ jobId, coverLetter });
      setShowModal(false);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Failed to apply:', error);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Apply Now
      </button>

      {showModal && (
        <ApplicationModal
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          isSubmitting={createApp.isPending}
          error={createApp.error}
        />
      )}
    </>
  );
}
```

## ⚙️ Configuración de React Query

El `QueryClient` está configurado con valores optimizados:

```typescript
// src/lib/queryClient.ts
{
  staleTime: 5 minutos,           // Datos frescos por 5 min
  gcTime: 10 minutos,             // Cache por 10 min
  retry: 2 veces (excepto 4xx),   // Reintentos inteligentes
  refetchOnWindowFocus: false     // No refetch al cambiar de tab
}
```

### Invalidación Manual de Cache

```typescript
import { queryClient } from '@/lib/queryClient';

// Invalidar queries específicas
queryClient.invalidateQueries({ queryKey: ['jobs'] });
queryClient.invalidateQueries({ queryKey: ['applications'] });

// Invalidar todo
queryClient.invalidateQueries();
```

## 🎯 Mejores Prácticas

### 1. Separación de Lógica

✅ **Correcto**: Lógica en hooks, UI en componentes

```typescript
// Hook personalizado
function useJobFilters() {
  const [filters, setFilters] = useState({});
  const { data, isLoading } = useJobs(filters);
  
  return { data, isLoading, filters, setFilters };
}

// Componente solo UI
function JobList() {
  const { data, isLoading } = useJobFilters();
  return <div>{/* UI */}</div>;
}
```

❌ **Incorrecto**: Todo en el componente

```typescript
function JobList() {
  const [filters, setFilters] = useState({});
  const { data } = useJobs(filters);
  // Mucha lógica aquí...
}
```

### 2. Manejo de Errores

✅ **Correcto**: Usar QueryStateHandler o ErrorMessage

```typescript
<QueryStateHandler
  isLoading={isLoading}
  isError={isError}
  error={error}
  data={data}
  onRetry={() => refetch()}
>
  {(data) => <Content data={data} />}
</QueryStateHandler>
```

### 3. Optimistic Updates

```typescript
const updateStatus = useUpdateApplicationStatus();

const handleUpdate = async (id: string, status: string) => {
  // Actualización optimista
  queryClient.setQueryData(['applications'], (old) => {
    return old.map(app => 
      app.id === id ? { ...app, status } : app
    );
  });

  try {
    await updateStatus.mutateAsync({ id, dto: { status } });
  } catch (error) {
    // Revertir en caso de error
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  }
};
```

### 4. Paginación

```typescript
function JobList() {
  const [page, setPage] = useState(1);
  const { data } = useJobs({ page, pageSize: 20 });

  // React Query cachea cada página automáticamente
  return (
    <div>
      {data.items.map(job => <JobCard key={job.id} job={job} />)}
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}
```

## 🔍 Debugging

### Logs en Desarrollo

La API automáticamente loguea requests/responses en desarrollo:

```
[API Request] GET /api/jobs?keyword=React
[API Response] GET /api/jobs { success: true, data: {...} }
```

### React Query DevTools

Para instalar las devtools (opcional):

```bash
npm install @tanstack/react-query-devtools
```

Luego en `QueryProvider.tsx`:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## 📚 Recursos

- [React Query Docs](https://tanstack.com/query/latest)
- [Axios Docs](https://axios-http.com/)
- Ver ejemplos completos en `src/components/examples/`

## 🚨 Troubleshooting

### Error: "Network Error"

Verifica que el backend esté corriendo y que `VITE_API_BASE_URL` esté configurado correctamente.

### Error: "Query data is undefined"

Asegúrate de manejar el estado de carga antes de acceder a `data`:

```typescript
if (isLoading) return <LoadingSpinner />;
if (!data) return null;
// Ahora data está garantizado
```

### Cache no se actualiza

Usa `invalidateQueries` después de mutations:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['jobs'] });
}
```
