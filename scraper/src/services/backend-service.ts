import axios, { AxiosInstance } from 'axios';
import { IBackendService } from '../types/interfaces';
import { JobNormalized, BackendResponse } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';
import { withRetry } from '../utils/retry';
import { BackendAdapter } from '../adapters/backend-adapter';

export class BackendService implements IBackendService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.backend.url,
      timeout: config.backend.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.backend.apiKey && { 'X-API-Key': config.backend.apiKey }),
      },
    });
  }

  async sendJobs(jobs: JobNormalized[]): Promise<void> {
    if (jobs.length === 0) {
      logger.warn('No jobs to send to backend');
      return;
    }

    const batches = this.createBatches(jobs, config.scraper.batchSize);
    logger.info(`Sending ${jobs.length} jobs in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        await withRetry(
          () => this.sendBatch(batch),
          {
            maxRetries: config.backend.retries,
            delayMs: 1000,
            backoff: true,
          },
          `Sending batch ${i + 1}/${batches.length}`
        );

        logger.info(`Batch ${i + 1}/${batches.length} sent successfully (${batch.length} jobs)`);
      } catch (error) {
        logger.error(`Failed to send batch ${i + 1}/${batches.length}`, error);
        throw error;
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Backend health check failed', error);
      return false;
    }
  }

  private async sendBatch(jobs: JobNormalized[]): Promise<BackendResponse> {
    // Transform to backend DTO format
    const dtos = jobs.map(job => BackendAdapter.toCreateJobDto(job));
    
    const response = await this.client.post<BackendResponse>('/api/jobs/ingest', dtos);
    
    if (response.data.errors && response.data.errors.length > 0) {
      logger.warn('Backend reported errors', { errors: response.data.errors });
    }

    return response.data;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
