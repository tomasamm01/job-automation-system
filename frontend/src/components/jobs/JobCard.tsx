import { Link } from 'react-router-dom';
import { Building2, Clock, DollarSign, Heart, ArrowRight, Home } from 'lucide-react';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { JobListItem } from '@/types';

interface JobCardProps {
  job: JobListItem;
  isHighlighted?: boolean;
}

export function JobCard({ job, isHighlighted = false }: JobCardProps) {

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border p-5 transition-all hover:shadow-md hover:border-indigo-300 group',
        isHighlighted && 'ring-2 ring-indigo-500 ring-offset-2',
        'border-slate-200'
      )}
    >
      {/* Score Badge - Prominente en esquina superior izquierda */}
      <div className="absolute top-4 left-4">
        <ScoreBadge score={job.relevanceScore} size="md" />
      </div>

      {/* Bookmark Button - Esquina superior derecha */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
        aria-label="Save job"
      >
        <Heart className="w-5 h-5" />
      </button>

      {/* Contenido principal - con padding para el score */}
      <div className="pt-16">
        <Link to={`/jobs/${job.id}`} className="block">
          <h3 className="text-lg font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
            {job.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.companyName}</span>
            {job.location && (
              <>
                <span className="text-slate-300">•</span>
                <span className="truncate">{job.location}</span>
              </>
            )}
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {job.workMode === 'Remote' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                <Home className="w-3 h-3" />
                Remote OK
              </span>
            )}
            {job.salaryRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                <DollarSign className="w-3 h-3" />
                {job.salaryRange}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              Posted {formatRelativeTime(job.createdAt)}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
              View Details
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
