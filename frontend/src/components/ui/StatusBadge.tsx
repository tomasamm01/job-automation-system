import { cn } from '@/lib/utils';
import { ApplicationStatus, JobStatus, WorkMode } from '@/types';

type BadgeVariant = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  showDot?: boolean;
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  applied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  screening: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  interview: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  offer: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  withdrawn: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'border-2 border-gray-400' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  neutral: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
};

function getApplicationStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case ApplicationStatus.Offered:
    case ApplicationStatus.Accepted:
      return 'offer';
    case ApplicationStatus.Interview:
      return 'interview';
    case ApplicationStatus.InReview:
      return 'screening';
    case ApplicationStatus.Applied:
    case ApplicationStatus.Pending:
      return 'applied';
    case ApplicationStatus.Rejected:
      return 'rejected';
    case ApplicationStatus.Withdrawn:
      return 'withdrawn';
    default:
      return 'neutral';
  }
}

function getJobStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case JobStatus.Active:
      return 'success';
    case JobStatus.Expired:
    case JobStatus.Closed:
      return 'error';
    case JobStatus.Filled:
      return 'neutral';
    default:
      return 'neutral';
  }
}

function getWorkModeVariant(mode: string): BadgeVariant {
  switch (mode) {
    case WorkMode.Remote:
      return 'success';
    case WorkMode.Hybrid:
      return 'info';
    case WorkMode.OnSite:
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function StatusBadge({ status, variant, showDot = true }: StatusBadgeProps) {
  const resolvedVariant = variant || getApplicationStatusVariant(status);
  const colors = variantClasses[resolvedVariant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
        colors.bg,
        colors.text
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
      )}
      {status}
    </span>
  );
}

export function JobStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} variant={getJobStatusVariant(status)} />;
}

export function WorkModeBadge({ mode }: { mode: string }) {
  return <StatusBadge status={mode} variant={getWorkModeVariant(mode)} />;
}

export function ApplicationStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} variant={getApplicationStatusVariant(status)} />;
}
