import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { FiltersPanel, JobList, Pagination } from '@/components/jobs';
import { useJobs } from '@/hooks';
import type { JobFilters } from '@/types';

export function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, isError, error, refetch } = useJobs(filters);

  const hasActiveFilters = !!(
    filters.keyword ||
    filters.jobType ||
    filters.workMode ||
    filters.location ||
    filters.minRelevanceScore
  );

  return (
    <div>
      <Header
        title="Job Opportunities"
        subtitle={data ? `${data.totalCount} jobs scored by relevance` : 'Loading...'}
      />

      <div className="p-6 space-y-6">
        <FiltersPanel filters={filters} onFiltersChange={setFilters} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Sorted by</span>
            <span className="text-sm font-medium text-slate-900">
              Relevance Score (High → Low)
            </span>
          </div>
          {data && data.totalCount > 0 && (
            <p className="text-sm text-slate-500">
              Showing top matches first
            </p>
          )}
        </div>

        <JobList
          jobs={data?.items}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          hasFilters={hasActiveFilters}
        />

        {data && data.totalPages > 1 && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            totalCount={data.totalCount}
            pageSize={data.pageSize}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        )}
      </div>
    </div>
  );
}
