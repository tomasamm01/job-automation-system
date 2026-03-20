import { BaseSource } from '../base-source';
import { JobRaw, ScraperConfig } from '../../types';
import { config } from '../../config';

export class LinkedInSource extends BaseSource {
  constructor() {
    const scraperConfig: ScraperConfig = {
      name: 'LinkedIn',
      enabled: config.sources.linkedin.enabled,
      schedule: config.sources.linkedin.schedule,
      batchSize: 50,
      rateLimit: {
        maxRequests: 5,
        perMilliseconds: 60000,
      },
    };

    super('LinkedIn', scraperConfig);
  }

  async fetchJobs(): Promise<JobRaw[]> {
    this.logger.warn('LinkedIn scraper not yet implemented');
    return [];
  }
}
