import { BaseSource } from '../base-source';
import { JobRaw, ScraperConfig } from '../../types';
import { config } from '../../config';

export class GetOnBoardSource extends BaseSource {
  constructor() {
    const scraperConfig: ScraperConfig = {
      name: 'GetOnBoard',
      enabled: config.sources.getonboard.enabled,
      schedule: config.sources.getonboard.schedule,
      batchSize: 50,
      rateLimit: {
        maxRequests: 10,
        perMilliseconds: 60000,
      },
    };

    super('GetOnBoard', scraperConfig);
  }

  async fetchJobs(): Promise<JobRaw[]> {
    this.logger.warn('GetOnBoard scraper not yet implemented');
    return [];
  }
}
