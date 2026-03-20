import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ApplicationCard } from '@/components/applications/ApplicationCard';
import { useApplications } from '@/hooks';
import { JobListSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ApplicationStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusFilters = [
  { value: undefined, label: 'All' },
  { value: ApplicationStatus.Applied, label: 'Applied' },
  { value: ApplicationStatus.InReview, label: 'In Review' },
  { value: ApplicationStatus.Interview, label: 'Interview' },
  { value: ApplicationStatus.Offered, label: 'Offered' },
  { value: ApplicationStatus.Rejected, label: 'Rejected' },
];

export function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: applications, isLoading, isError, error, refetch } = useApplications(statusFilter);

  const getStatusCount = (status: string | undefined) => {
    if (!applications) return 0;
    if (!status) return applications.length;
    return applications.filter(a => a.status === status).length;
  };

  return (
    <div>
      <Header
        title="Application Tracker"
        subtitle={applications ? `${applications.length} applications` : 'Loading...'}
      />

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-2">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  statusFilter === filter.value
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {filter.label}
                {applications && (
                  <span className={cn(
                    'ml-2 px-1.5 py-0.5 text-xs rounded-full',
                    statusFilter === filter.value
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}>
                    {getStatusCount(filter.value)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <JobListSkeleton count={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to load applications"
            message={error?.message}
            onRetry={() => refetch()}
          />
        ) : !applications || applications.length === 0 ? (
          <EmptyState
            icon="file"
            title={statusFilter ? 'No applications with this status' : 'No applications yet'}
            description={
              statusFilter
                ? 'Try selecting a different status filter.'
                : 'Start applying to jobs to track your progress here.'
            }
          />
        ) : (
          <div className="space-y-3">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
