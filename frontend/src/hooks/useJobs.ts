import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/services/api';
import type { JobFilters } from '@/types';

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsApi.getJobs(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getJob(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
