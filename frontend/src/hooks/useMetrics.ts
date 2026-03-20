import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '@/services/api';

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics', 'dashboard'],
    queryFn: () => metricsApi.getDashboardMetrics(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}
