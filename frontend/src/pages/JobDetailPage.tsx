import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  DollarSign,
  Briefcase,
  Calendar,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { JobStatusBadge, WorkModeBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useJob, useCreateApplication } from '@/hooks';
import { formatDate, formatRelativeTime, getScoreLabel } from '@/lib/utils';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, isError, error, refetch } = useJob(id);
  const createApplication = useCreateApplication();
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!job) return;
    
    setIsApplying(true);
    try {
      await createApplication.mutateAsync({ jobId: job.id });
      setApplied(true);
    } catch (err) {
      console.error('Failed to apply:', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Loading..." />
        <div className="p-6">
          <JobDetailSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div>
        <Header title="Job Not Found" />
        <div className="p-6">
          <ErrorState
            title="Failed to load job"
            message={error?.message || 'The job you are looking for could not be found.'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={job.title} subtitle={job.company.name} />

      <div className="p-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="w-5 h-5" />
                    <span className="text-lg">{job.company.name}</span>
                  </div>
                </div>
                <ScoreBadge score={job.relevanceScore} size="lg" showLabel />
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <WorkModeBadge mode={job.workMode} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Briefcase className="w-4 h-4" />
                  {job.jobType}
                </span>
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                    <DollarSign className="w-4 h-4" />
                    {job.salaryRange}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-500 pb-6 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Posted {formatRelativeTime(job.createdAt)}
                </span>
                {job.expiresAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Expires {formatDate(job.expiresAt)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  Source: {job.source}
                </span>
              </div>

              {job.description && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Description</h2>
                  <div className="prose prose-slate prose-sm max-w-none">
                    <p className="text-slate-600 whitespace-pre-wrap">{job.description}</p>
                  </div>
                </div>
              )}

              {job.requirements && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Requirements</h2>
                  <div className="prose prose-slate prose-sm max-w-none">
                    <p className="text-slate-600 whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Match Analysis</h2>
              
              <div className="text-center py-4 mb-4 bg-slate-50 rounded-xl">
                <div className="text-4xl font-bold text-slate-900 mb-1">
                  {Math.round(job.relevanceScore)}%
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {getScoreLabel(job.relevanceScore)}
                </p>
              </div>

              <div className="space-y-3">
                <ScoreBreakdownItem label="Keywords Match" score={85} />
                <ScoreBreakdownItem label="Work Mode" score={100} />
                <ScoreBreakdownItem label="Job Completeness" score={75} />
                <ScoreBreakdownItem label="Salary Range" score={70} />
              </div>

              <p className="text-xs text-slate-500 mt-4 text-center">
                Score based on your profile preferences
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Company Info</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{job.company.name}</p>
                    {job.company.industry && (
                      <p className="text-sm text-slate-500">{job.company.industry}</p>
                    )}
                  </div>
                </div>

                {job.company.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {job.company.location}
                  </div>
                )}

                {job.company.website && (
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {applied ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900">Application Submitted!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Track your progress in Applications
                  </p>
                  <button
                    onClick={() => navigate('/applications')}
                    className="mt-4 w-full py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Applications
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleApply}
                    disabled={isApplying || job.status !== 'Active'}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isApplying ? 'Applying...' : 'Apply Now'}
                  </button>

                  {job.sourceUrl && (
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      View Original Posting
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBreakdownItem({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{score}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function JobDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
