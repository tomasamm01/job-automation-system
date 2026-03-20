import { Link } from 'react-router-dom';
import { Building2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { ApplicationListItem } from '@/types';

interface ApplicationCardProps {
  application: ApplicationListItem;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Link
      to={`/applications/${application.id}`}
      className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 transition-all hover:shadow-md hover:border-slate-300"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-slate-900 truncate">
          {application.jobTitle}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{application.companyName}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Applied {formatRelativeTime(application.appliedAt)}
          </span>
          {application.interviewDate && (
            <span className="flex items-center gap-1 text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
              Interview: {formatDate(application.interviewDate)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <ApplicationStatusBadge status={application.status} />
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </Link>
  );
}
