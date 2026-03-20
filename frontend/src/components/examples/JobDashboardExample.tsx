import { useState } from 'react';
import { useJobs } from '@/hooks';
import { QueryStateHandler } from '@/components/ui';
import type { JobFilters, JobListItem } from '@/types';

export function JobDashboardExample() {
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, isError, error, refetch } = useJobs(filters);

  const handleSearch = (keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword, page: 1 }));
  };

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Dashboard</h1>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <JobFiltersBar onSearch={handleSearch} onFilterChange={handleFilterChange} />

      <QueryStateHandler
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        isEmpty={(data) => data.items.length === 0}
        loadingMessage="Loading jobs..."
        emptyTitle="No jobs found"
        emptyDescription="Try adjusting your filters or check back later for new opportunities."
        onRetry={() => refetch()}
      >
        {(pagedData) => (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Showing {pagedData.items.length} of {pagedData.totalCount} jobs
            </div>
            <div className="grid gap-4">
              {pagedData.items.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            <Pagination
              currentPage={pagedData.page}
              totalPages={pagedData.totalPages}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </QueryStateHandler>
    </div>
  );
}

function JobFiltersBar({
  onSearch,
  onFilterChange,
}: {
  onSearch: (keyword: string) => void;
  onFilterChange: (filters: Partial<JobFilters>) => void;
}) {
  return (
    <div className="flex gap-4">
      <input
        type="text"
        placeholder="Search jobs..."
        onChange={(e) => onSearch(e.target.value)}
        className="flex-1 px-4 py-2 border rounded-md"
      />
      <select
        onChange={(e) => onFilterChange({ workMode: e.target.value as any })}
        className="px-4 py-2 border rounded-md"
      >
        <option value="">All Work Modes</option>
        <option value="Remote">Remote</option>
        <option value="OnSite">On-Site</option>
        <option value="Hybrid">Hybrid</option>
      </select>
    </div>
  );
}

function JobCard({ job }: { job: JobListItem }) {
  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg">{job.title}</h3>
      <p className="text-gray-600">{job.companyName}</p>
      <div className="mt-2 flex gap-2 text-sm text-gray-500">
        <span>{job.workMode}</span>
        <span>•</span>
        <span>{job.location}</span>
        <span>•</span>
        <span>Score: {job.relevanceScore}%</span>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-md disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-4 py-2">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-md disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
