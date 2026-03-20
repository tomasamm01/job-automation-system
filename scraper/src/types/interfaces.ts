import { JobRaw, JobNormalized, ScraperConfig, ScraperResult } from './index';

export interface IJobSource {
  readonly name: string;
  readonly config: ScraperConfig;
  fetchJobs(): Promise<JobRaw[]>;
}

export interface IJobExtractor {
  extractTitle(data: any): string;
  extractCompany(data: any): string;
  extractLocation(data: any): string;
  extractDescription(data: any): string;
  extractSalary(data: any): { min: number | null; max: number | null };
  extractUrl(data: any): string;
  extractExternalId(data: any): string;
}

export interface IJobNormalizer {
  normalize(raw: JobRaw): JobNormalized;
  validateJob(job: JobNormalized): boolean;
}

export interface IBackendService {
  sendJobs(jobs: JobNormalized[]): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface IScheduler {
  start(): void;
  stop(): void;
  addJob(source: IJobSource): void;
}
