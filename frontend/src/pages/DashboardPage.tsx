import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  Flame,
  Target,
  Award
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useMetrics } from '@/hooks';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function DashboardPage() {
  const { data: metrics, isLoading, isError, error, refetch } = useMetrics();

  return (
    <div>
      <Header 
        title="Dashboard" 
        subtitle="Your job search command center"
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <ErrorState
            title="Failed to load metrics"
            message={error?.message}
            onRetry={() => refetch()}
          />
        ) : metrics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Jobs"
                value={metrics.totalJobs}
                icon={Briefcase}
                color="blue"
                href="/jobs"
              />
              <MetricCard
                title="Applications"
                value={metrics.totalApplications}
                icon={FileText}
                color="indigo"
                href="/applications"
              />
              <MetricCard
                title="Interviews"
                value={metrics.interviewsScheduled}
                icon={Calendar}
                color="emerald"
                href="/applications?status=Interview"
              />
              <MetricCard
                title="Avg. Match Score"
                value={`${Math.round(metrics.averageRelevanceScore)}%`}
                icon={Target}
                color="amber"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Pipeline Performance
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <RateCard
                    label="Response Rate"
                    value={metrics.responseRate}
                    icon={TrendingUp}
                    description="Companies that responded"
                  />
                  <RateCard
                    label="Interview Rate"
                    value={metrics.interviewRate}
                    icon={Flame}
                    description="Applications → Interviews"
                  />
                  <RateCard
                    label="Offer Rate"
                    value={metrics.offerRate}
                    icon={Award}
                    description="Interviews → Offers"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent Activity
                  </h2>
                  <Link
                    to="/applications"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {metrics.recentActivity.length > 0 ? (
                    metrics.recentActivity.slice(0, 5).map((activity, index) => (
                      <ActivityItem key={index} activity={activity} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    Ready to find your next opportunity?
                  </h2>
                  <p className="text-blue-100">
                    {metrics.totalJobs} jobs scored and ready for review
                  </p>
                </div>
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Browse Jobs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'indigo' | 'emerald' | 'amber';
  href?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
};

function MetricCard({ title, value, icon: Icon, color, href }: MetricCardProps) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-600">{title}</p>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

interface RateCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  description: string;
}

function RateCard({ label, value, icon: Icon, description }: RateCardProps) {
  const percentage = Math.round(value * 100);
  
  return (
    <div className="text-center p-4 bg-slate-50 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{percentage}%</p>
      <p className="text-sm font-medium text-slate-700 mt-1">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

interface ActivityItemProps {
  activity: {
    type: string;
    description: string;
    timestamp: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const timeAgo = new Date(activity.timestamp).toLocaleDateString();
  
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">{activity.description}</p>
        <p className="text-xs text-slate-500">{timeAgo}</p>
      </div>
    </div>
  );
}
