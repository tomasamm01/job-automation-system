import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { ApplicationStatusSelect } from '@/components/applications/ApplicationStatusSelect';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useApplication, useUpdateApplicationStatus } from '@/hooks';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: application, isLoading, isError, error, refetch } = useApplication(id);
  const updateStatus = useUpdateApplicationStatus();

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    
    try {
      await updateStatus.mutateAsync({
        id: application.id,
        dto: { status: newStatus as ApplicationStatus },
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Loading..." />
        <div className="p-6">
          <ApplicationDetailSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div>
        <Header title="Application Not Found" />
        <div className="p-6">
          <ErrorState
            title="Failed to load application"
            message={error?.message || 'The application could not be found.'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={application.jobTitle} subtitle={application.companyName} />

      <div className="p-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {application.jobTitle}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="w-5 h-5" />
                    <span className="text-lg">{application.companyName}</span>
                  </div>
                </div>
                <ApplicationStatusBadge status={application.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Applied</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(application.appliedAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatRelativeTime(application.appliedAt)}
                  </p>
                </div>
                {application.responseDate && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Response Received</p>
                    <p className="font-medium text-slate-900">
                      {formatDate(application.responseDate)}
                    </p>
                  </div>
                )}
                {application.interviewDate && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Interview Scheduled</p>
                    <p className="font-medium text-blue-600">
                      {formatDate(application.interviewDate)}
                    </p>
                  </div>
                )}
              </div>

              {application.coverLetter && (
                <div className="mt-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                    <FileText className="w-5 h-5" />
                    Cover Letter
                  </h2>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              )}

              {application.notes && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Notes</h2>
                  <p className="text-slate-600 whitespace-pre-wrap">{application.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <ApplicationStatusSelect
                currentStatus={application.status}
                onStatusChange={handleStatusChange}
                disabled={updateStatus.isPending}
              />
              
              {updateStatus.isPending && (
                <p className="text-sm text-slate-500 mt-3">Updating status...</p>
              )}
              
              {updateStatus.isError && (
                <p className="text-sm text-red-600 mt-3">
                  Failed to update status. Please try again.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <TimelineItem
                  icon={Clock}
                  title="Applied"
                  date={application.appliedAt}
                  isCompleted
                />
                {application.responseDate && (
                  <TimelineItem
                    icon={Calendar}
                    title="Response Received"
                    date={application.responseDate}
                    isCompleted
                  />
                )}
                {application.interviewDate && (
                  <TimelineItem
                    icon={Calendar}
                    title="Interview"
                    date={application.interviewDate}
                    isCompleted={new Date(application.interviewDate) < new Date()}
                    isUpcoming={new Date(application.interviewDate) >= new Date()}
                  />
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  to={`/jobs/${application.jobId}`}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  View Job Details
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineItemProps {
  icon: React.ElementType;
  title: string;
  date: string;
  isCompleted?: boolean;
  isUpcoming?: boolean;
}

function TimelineItem({ icon: Icon, title, date, isCompleted, isUpcoming }: TimelineItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isCompleted ? 'bg-emerald-100 text-emerald-600' :
        isUpcoming ? 'bg-blue-100 text-blue-600' :
        'bg-slate-100 text-slate-400'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{formatDate(date)}</p>
      </div>
    </div>
  );
}

function ApplicationDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="grid grid-cols-2 gap-4 py-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
