export interface JobRaw {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  workMode?: string;
  jobType?: string;
  postedAt?: Date;
  tags?: string[];
  [key: string]: any;
}

export interface JobNormalized {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  workMode: string;
  jobType: string;
}

export interface ScraperConfig {
  name: string;
  enabled: boolean;
  schedule: string;
  batchSize: number;
  rateLimit?: {
    maxRequests: number;
    perMilliseconds: number;
  };
}

export interface ScraperResult {
  source: string;
  jobsFound: number;
  jobsFiltered?: number;
  jobsNormalized: number;
  jobsSent: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export interface BackendResponse {
  success: boolean;
  processed: number;
  duplicates: number;
  errors: string[];
}
