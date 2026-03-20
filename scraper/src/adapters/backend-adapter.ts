import { JobNormalized } from '../types';

export interface CreateJobDto {
  title: string;
  description: string | null;
  requirements: string | null;
  location: string;
  jobType: string;
  workMode: string;
  salaryRange: string | null;
  externalId: string;
  sourceUrl: string;
  source: string;
  expiresAt: string | null;
  company: CreateCompanyDto;
}

export interface CreateCompanyDto {
  name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  description?: string | null;
}

export class BackendAdapter {
  static toCreateJobDto(job: JobNormalized): CreateJobDto {
    return {
      title: job.title,
      description: job.description || null,
      requirements: null,
      location: job.location,
      jobType: this.mapJobType(job.jobType),
      workMode: this.mapWorkMode(job.workMode),
      salaryRange: this.formatSalaryRange(job.salaryMin, job.salaryMax),
      externalId: job.externalId,
      sourceUrl: job.url,
      source: job.source,
      expiresAt: null,
      company: {
        name: job.company,
        website: null,
        industry: null,
        location: null,
        logoUrl: null,
        description: null,
      },
    };
  }

  static mapWorkMode(mode: string): string {
    const mapping: Record<string, string> = {
      'remote': 'Remote',
      'hybrid': 'Hybrid',
      'onsite': 'OnSite',
      'on-site': 'OnSite',
      'office': 'OnSite',
    };
    
    const normalized = mode.toLowerCase().trim();
    return mapping[normalized] || 'Remote';
  }

  static mapJobType(type: string): string {
    const mapping: Record<string, string> = {
      'full-time': 'FullTime',
      'fulltime': 'FullTime',
      'full time': 'FullTime',
      'part-time': 'PartTime',
      'parttime': 'PartTime',
      'part time': 'PartTime',
      'contract': 'Contract',
      'contractor': 'Contract',
      'freelance': 'Freelance',
      'temporary': 'Contract',
      'internship': 'Internship',
    };
    
    const normalized = type.toLowerCase().trim();
    return mapping[normalized] || 'FullTime';
  }

  static formatSalaryRange(min: number | null, max: number | null): string | null {
    if (!min && !max) return null;
    
    if (min && max) {
      return `$${min.toLocaleString('en-US')} - $${max.toLocaleString('en-US')}`;
    }
    
    if (min) {
      return `From $${min.toLocaleString('en-US')}`;
    }
    
    if (max) {
      return `Up to $${max.toLocaleString('en-US')}`;
    }
    
    return null;
  }
}
