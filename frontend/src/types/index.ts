export const JobType = {
  FullTime: 'FullTime',
  PartTime: 'PartTime',
  Contract: 'Contract',
  Freelance: 'Freelance',
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];

export const WorkMode = {
  Remote: 'Remote',
  OnSite: 'OnSite',
  Hybrid: 'Hybrid',
} as const;
export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

export const JobStatus = {
  Active: 'Active',
  Expired: 'Expired',
  Filled: 'Filled',
  Closed: 'Closed',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const ApplicationStatus = {
  Pending: 'Pending',
  Applied: 'Applied',
  InReview: 'InReview',
  Interview: 'Interview',
  Offered: 'Offered',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
  Withdrawn: 'Withdrawn',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  logoUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  jobType: JobType;
  workMode: WorkMode;
  salaryRange?: string;
  source: string;
  sourceUrl?: string;
  status: JobStatus;
  relevanceScore: number;
  createdAt: string;
  expiresAt?: string;
  company: Company;
}

export interface JobListItem {
  id: string;
  title: string;
  location?: string;
  jobType: JobType;
  workMode: WorkMode;
  salaryRange?: string;
  status: JobStatus;
  relevanceScore: number;
  createdAt: string;
  companyName: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  appliedAt: string;
  coverLetter?: string;
  notes?: string;
  responseDate?: string;
  interviewDate?: string;
  createdAt: string;
}

export interface ApplicationListItem {
  id: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  appliedAt: string;
  interviewDate?: string;
}

export interface DashboardMetrics {
  totalJobs: number;
  totalApplications: number;
  pendingApplications: number;
  interviewsScheduled: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  averageRelevanceScore: number;
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface JobFilters {
  keyword?: string;
  jobType?: JobType;
  workMode?: WorkMode;
  location?: string;
  status?: JobStatus;
  minRelevanceScore?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateApplicationDto {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
  notes?: string;
  interviewDate?: string;
}
