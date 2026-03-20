import { useApplications, useUpdateApplicationStatus } from '@/hooks';
import { QueryStateHandler } from '@/components/ui';
import type { ApplicationListItem, ApplicationStatus } from '@/types';
import { useState } from 'react';

export function ApplicationTrackerExample() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading, isError, error, refetch } = useApplications(statusFilter);
  const updateStatus = useUpdateApplicationStatus();

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      await updateStatus.mutateAsync({ id, dto: { status } });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Application Tracker</h1>
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || undefined)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Applied">Applied</option>
          <option value="InReview">In Review</option>
          <option value="Interview">Interview</option>
          <option value="Offered">Offered</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <QueryStateHandler
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        isEmpty={(data) => data.length === 0}
        loadingMessage="Loading applications..."
        emptyTitle="No applications found"
        emptyDescription="Start applying to jobs to track your applications here."
        onRetry={() => refetch()}
      >
        {(applications) => (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </div>
            <div className="grid gap-4">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onStatusChange={(status) => handleStatusChange(app.id, status)}
                  isUpdating={updateStatus.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </QueryStateHandler>
    </div>
  );
}

function ApplicationCard({
  application,
  onStatusChange,
  isUpdating,
}: {
  application: ApplicationListItem;
  onStatusChange: (status: ApplicationStatus) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{application.jobTitle}</h3>
          <p className="text-gray-600">{application.companyName}</p>
          <p className="text-sm text-gray-500 mt-1">
            Applied: {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        </div>
        <select
          value={application.status}
          onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
          disabled={isUpdating}
          className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
        >
          <option value="Pending">Pending</option>
          <option value="Applied">Applied</option>
          <option value="InReview">In Review</option>
          <option value="Interview">Interview</option>
          <option value="Offered">Offered</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Withdrawn">Withdrawn</option>
        </select>
      </div>
    </div>
  );
}
