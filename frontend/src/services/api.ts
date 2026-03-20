import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import type {
  ApiResponse,
  PagedResult,
  JobListItem,
  Job,
  Application,
  ApplicationListItem,
  DashboardMetrics,
  JobFilters,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
} from '@/types';

export class ApiError extends Error {
  statusCode?: number;
  errors?: string[];

  constructor(message: string, statusCode?: number, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    if (env.isDevelopment) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (env.isDevelopment) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const statusCode = error.response?.status;
    const errors = error.response?.data?.errors;

    if (env.isDevelopment) {
      console.error('[API Error]', { message, statusCode, errors });
    }

    return Promise.reject(new ApiError(message, statusCode, errors));
  }
);

export const jobsApi = {
  getJobs: async (filters: JobFilters = {}): Promise<PagedResult<JobListItem>> => {
    const params = new URLSearchParams();
    
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.jobType) params.append('jobType', filters.jobType);
    if (filters.workMode) params.append('workMode', filters.workMode);
    if (filters.location) params.append('location', filters.location);
    if (filters.status) params.append('status', filters.status);
    if (filters.minRelevanceScore !== undefined) {
      params.append('minRelevanceScore', filters.minRelevanceScore.toString());
    }
    params.append('page', (filters.page || 1).toString());
    params.append('pageSize', (filters.pageSize || 20).toString());

    const response = await api.get<ApiResponse<PagedResult<JobListItem>>>(`/jobs?${params}`);
    return response.data.data;
  },

  getJob: async (id: string): Promise<Job> => {
    const response = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data.data;
  },
};

export const applicationsApi = {
  getApplications: async (status?: string): Promise<ApplicationListItem[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<ApiResponse<ApplicationListItem[]>>(`/applications${params}`);
    return response.data.data;
  },

  getApplication: async (id: string): Promise<Application> => {
    const response = await api.get<ApiResponse<Application>>(`/applications/${id}`);
    return response.data.data;
  },

  createApplication: async (dto: CreateApplicationDto): Promise<Application> => {
    const response = await api.post<ApiResponse<Application>>('/applications', dto);
    return response.data.data;
  },

  updateStatus: async (id: string, dto: UpdateApplicationStatusDto): Promise<Application> => {
    const response = await api.patch<ApiResponse<Application>>(`/applications/${id}/status`, dto);
    return response.data.data;
  },
};

export const metricsApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get<ApiResponse<DashboardMetrics>>('/metrics/dashboard');
    return response.data.data;
  },
};

export default api;
