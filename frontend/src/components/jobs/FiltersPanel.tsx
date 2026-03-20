import { useState } from 'react';
import { Search, MapPin, Briefcase, Monitor, SlidersHorizontal, X } from 'lucide-react';
import { JobType, WorkMode, type JobFilters } from '@/types';
import { cn } from '@/lib/utils';

interface FiltersPanelProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
}

export function FiltersPanel({ filters, onFiltersChange }: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({ page: 1, pageSize: filters.pageSize });
  };

  const hasActiveFilters = !!(
    filters.keyword ||
    filters.jobType ||
    filters.workMode ||
    filters.location ||
    filters.minRelevanceScore
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or keywords..."
            value={filters.keyword || ''}
            onChange={(e) => updateFilter('keyword', e.target.value || undefined)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors',
            isExpanded || hasActiveFilters
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 flex items-center justify-center text-xs bg-indigo-600 text-white rounded-full">
              {[filters.jobType, filters.workMode, filters.location, filters.minRelevanceScore].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Briefcase className="w-3.5 h-3.5" />
              Job Type
            </label>
            <select
              value={filters.jobType || ''}
              onChange={(e) => updateFilter('jobType', (e.target.value as JobType) || undefined)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.values(JobType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Monitor className="w-3.5 h-3.5" />
              Work Mode
            </label>
            <select
              value={filters.workMode || ''}
              onChange={(e) => updateFilter('workMode', (e.target.value as WorkMode) || undefined)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modes</option>
              {Object.values(WorkMode).map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </label>
            <input
              type="text"
              placeholder="e.g., Remote, New York"
              value={filters.location || ''}
              onChange={(e) => updateFilter('location', e.target.value || undefined)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              Min Score: {filters.minRelevanceScore || 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minRelevanceScore || 0}
              onChange={(e) => updateFilter('minRelevanceScore', Number(e.target.value) || undefined)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-slate-500">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filters.keyword && (
              <FilterTag label={`"${filters.keyword}"`} onRemove={() => updateFilter('keyword', undefined)} />
            )}
            {filters.jobType && (
              <FilterTag label={filters.jobType} onRemove={() => updateFilter('jobType', undefined)} />
            )}
            {filters.workMode && (
              <FilterTag label={filters.workMode} onRemove={() => updateFilter('workMode', undefined)} />
            )}
            {filters.location && (
              <FilterTag label={filters.location} onRemove={() => updateFilter('location', undefined)} />
            )}
            {filters.minRelevanceScore && (
              <FilterTag label={`≥${filters.minRelevanceScore}%`} onRemove={() => updateFilter('minRelevanceScore', undefined)} />
            )}
          </div>
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 underline ml-auto"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
      {label}
      <button onClick={onRemove} className="hover:text-slate-900">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
