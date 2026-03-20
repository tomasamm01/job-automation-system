import { BaseSource } from '../base-source';
import { JobRaw, ScraperConfig } from '../../types';
import { config } from '../../config';

interface RemoteOKJob {
  id: string;
  slug: string;
  position: string;
  company: string;
  company_logo?: string;
  location?: string;
  tags?: string[];
  description?: string;
  url: string;
  date: string;
  salary_min?: number;
  salary_max?: number;
}

export class RemoteOKSource extends BaseSource {
  private readonly API_URL = config.sources.remoteok.apiUrl;

  constructor() {
    const scraperConfig: ScraperConfig = {
      name: 'RemoteOK',
      enabled: config.sources.remoteok.enabled,
      schedule: config.sources.remoteok.schedule,
      batchSize: 50,
      rateLimit: {
        maxRequests: 10,
        perMilliseconds: 60000,
      },
    };

    super('RemoteOK', scraperConfig);
  }

  async fetchJobs(): Promise<JobRaw[]> {
    try {
      this.logger.info('Starting RemoteOK scraping');

      const data = await this.fetchWithRateLimit<RemoteOKJob[]>(this.API_URL);

      if (!Array.isArray(data)) {
        this.logger.error('Invalid response format from RemoteOK API');
        return [];
      }

      const jobs = data
        .filter((item) => item && item.id && item.position)
        .map((item) => this.mapToJobRaw(item));

      this.logger.info(`Found ${jobs.length} jobs from RemoteOK`);
      return jobs;
    } catch (error) {
      this.logger.error('Failed to fetch jobs from RemoteOK', error);
      throw error;
    }
  }

  private mapToJobRaw(job: RemoteOKJob): JobRaw {
    return {
      externalId: job.id || job.slug,
      source: 'remoteok',
      title: job.position,
      company: job.company,
      location: job.location || 'Remote',
      url: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,
      description: job.description || job.position,
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      workMode: 'remote',
      jobType: 'full-time',
      postedAt: new Date(job.date),
      tags: job.tags || [],
    };
  }
}
