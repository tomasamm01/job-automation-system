import { Header } from '@/components/layout/Header';
import { useMetrics } from '@/hooks';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';

export function AnalyticsPage() {
  const { data: metrics, isLoading, isError, error, refetch } = useMetrics();

  if (isLoading) {
    return (
      <div>
        <Header title="Analytics" subtitle="Performance insights" />
        <div className="p-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <Header title="Analytics" />
        <div className="p-6">
          <ErrorState
            title="Failed to load analytics"
            message={error?.message}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div>
      <Header title="Analytics" subtitle="Track your job search performance" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Response Rate"
            value={`${Math.round(metrics.responseRate * 100)}%`}
            description="Companies that responded"
            icon={TrendingUp}
            trend={metrics.responseRate > 0.3 ? 'up' : 'neutral'}
          />
          <StatCard
            title="Interview Rate"
            value={`${Math.round(metrics.interviewRate * 100)}%`}
            description="Applications → Interviews"
            icon={Target}
            trend={metrics.interviewRate > 0.2 ? 'up' : 'neutral'}
          />
          <StatCard
            title="Offer Rate"
            value={`${Math.round(metrics.offerRate * 100)}%`}
            description="Interviews → Offers"
            icon={Award}
            trend={metrics.offerRate > 0.1 ? 'up' : 'neutral'}
          />
          <StatCard
            title="Avg. Match Score"
            value={`${Math.round(metrics.averageRelevanceScore)}%`}
            description="Average job relevance"
            icon={BarChart3}
            trend={metrics.averageRelevanceScore > 70 ? 'up' : 'neutral'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Application Funnel
            </h2>
            <FunnelChart
              stages={[
                { label: 'Total Applications', value: metrics.totalApplications, color: 'bg-slate-500' },
                { label: 'Got Response', value: Math.round(metrics.totalApplications * metrics.responseRate), color: 'bg-blue-500' },
                { label: 'Interviews', value: metrics.interviewsScheduled, color: 'bg-indigo-500' },
                { label: 'Offers', value: Math.round(metrics.interviewsScheduled * metrics.offerRate), color: 'bg-emerald-500' },
              ]}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Performance Summary
            </h2>
            <div className="space-y-6">
              <PerformanceMetric
                label="Jobs Analyzed"
                value={metrics.totalJobs}
                benchmark="Pipeline processed"
              />
              <PerformanceMetric
                label="Applications Sent"
                value={metrics.totalApplications}
                benchmark="Total tracked"
              />
              <PerformanceMetric
                label="Pending Review"
                value={metrics.pendingApplications}
                benchmark="Awaiting response"
              />
              <PerformanceMetric
                label="Interviews Scheduled"
                value={metrics.interviewsScheduled}
                benchmark="Upcoming"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InsightCard
              title="Best Performing"
              description={
                metrics.responseRate > 0.3
                  ? "Your response rate is above average! Keep targeting similar roles."
                  : "Consider tailoring your applications more to improve response rates."
              }
            />
            <InsightCard
              title="Score Quality"
              description={
                metrics.averageRelevanceScore > 70
                  ? "You're applying to highly relevant jobs. Great targeting!"
                  : "Try filtering for jobs with higher match scores."
              }
            />
            <InsightCard
              title="Next Steps"
              description={
                metrics.pendingApplications > 0
                  ? `You have ${metrics.pendingApplications} applications pending. Follow up on older ones.`
                  : "All caught up! Time to find more opportunities."
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        {trend === 'up' && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            Good
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <div key={stage.label}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600">{stage.label}</span>
            <span className="font-semibold text-slate-900">{stage.value}</span>
          </div>
          <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
            <div
              className={`h-full ${stage.color} rounded-lg transition-all duration-500`}
              style={{ width: `${(stage.value / maxValue) * 100}%` }}
            />
          </div>
          {index < stages.length - 1 && (
            <div className="flex justify-center my-2">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-200" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PerformanceMetric({ label, value, benchmark }: { label: string; value: number; benchmark: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{benchmark}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InsightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white/10 rounded-lg p-4">
      <p className="font-semibold text-white mb-1">{title}</p>
      <p className="text-sm text-slate-300">{description}</p>
    </div>
  );
}
