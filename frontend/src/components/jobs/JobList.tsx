import { JobCard } from './JobCard';
import { JobListSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { JobListItem } from '@/types';

interface JobListProps {
  jobs: JobListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  hasFilters?: boolean;
}

export function JobList({ jobs, isLoading, isError, error, onRetry, hasFilters }: JobListProps) {
  if (isLoading) {
    return <JobListSkeleton count={5} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load jobs"
        message={error?.message || 'An error occurred while fetching jobs.'}
        onRetry={onRetry}
      />
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={hasFilters ? 'search' : 'inbox'}
        title={hasFilters ? 'No jobs match your filters' : 'No jobs available'}
        description={
          hasFilters
            ? 'Try adjusting your filters or search criteria to find more opportunities.'
            : 'New job opportunities will appear here once they are ingested.'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => (
        <JobCard key={job.id} job={job} isHighlighted={index === 0 && job.relevanceScore >= 85} />
      ))}
    </div>
  );
}
