import axios, { AxiosInstance } from 'axios';
import { IJobSource } from '../types/interfaces';
import { JobRaw, ScraperConfig } from '../types';
import { SourceLogger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { config as globalConfig } from '../config';

export abstract class BaseSource implements IJobSource {
  protected logger: SourceLogger;
  protected httpClient: AxiosInstance;
  protected rateLimiter?: RateLimiter;

  constructor(
    public readonly name: string,
    public readonly config: ScraperConfig
  ) {
    this.logger = new SourceLogger(name);
    
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': globalConfig.scraper.userAgent,
      },
    });

    if (this.config.rateLimit) {
      this.rateLimiter = new RateLimiter(
        this.config.rateLimit.maxRequests,
        this.config.rateLimit.perMilliseconds
      );
    }
  }

  abstract fetchJobs(): Promise<JobRaw[]>;

  protected async fetchWithRateLimit<T>(url: string): Promise<T> {
    const fetch = async () => {
      const response = await this.httpClient.get<T>(url);
      return response.data;
    };

    if (this.rateLimiter) {
      return this.rateLimiter.execute(fetch);
    }

    return fetch();
  }
}
