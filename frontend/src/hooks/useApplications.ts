import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/services/api';
import type { CreateApplicationDto, UpdateApplicationStatusDto } from '@/types';

export function useApplications(status?: string) {
  return useQuery({
    queryKey: ['applications', status],
    queryFn: () => applicationsApi.getApplications(status),
    staleTime: 1000 * 60 * 2,
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.getApplication(id!),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateApplicationDto) => applicationsApi.createApplication(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateApplicationStatusDto }) =>
      applicationsApi.updateStatus(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}
