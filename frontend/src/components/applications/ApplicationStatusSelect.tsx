import { ApplicationStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ApplicationStatusSelectProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

const statusOptions = [
  { value: ApplicationStatus.Applied, label: 'Applied', color: 'bg-amber-500' },
  { value: ApplicationStatus.InReview, label: 'In Review', color: 'bg-blue-500' },
  { value: ApplicationStatus.Interview, label: 'Interview', color: 'bg-indigo-500' },
  { value: ApplicationStatus.Offered, label: 'Offered', color: 'bg-emerald-500' },
  { value: ApplicationStatus.Accepted, label: 'Accepted', color: 'bg-green-600' },
  { value: ApplicationStatus.Rejected, label: 'Rejected', color: 'bg-red-500' },
  { value: ApplicationStatus.Withdrawn, label: 'Withdrawn', color: 'bg-slate-500' },
];

export function ApplicationStatusSelect({
  currentStatus,
  onStatusChange,
  disabled = false,
}: ApplicationStatusSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Update Status
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            disabled={disabled || currentStatus === option.value}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all',
              currentStatus === option.value
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={cn('w-2 h-2 rounded-full', option.color)} />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
