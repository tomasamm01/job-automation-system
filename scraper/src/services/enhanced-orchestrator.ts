import { IJobSource, IJobNormalizer, IBackendService } from '../types/interfaces';
import { ScraperResult, JobNormalized } from '../types';
import { logger } from '../utils/logger';
import { LocalCache } from '../cache/local-cache';
import { MetricsCollector } from '../metrics/metrics-collector';
import { BackpressureController } from '../utils/backpressure';
import { CircuitBreaker } from '../utils/retry';

export class EnhancedOrchestrator {
  private normalizers: Map<string, IJobNormalizer> = new Map();
  private cache?: LocalCache;
  private metricsCollector?: MetricsCollector;
  private backpressure?: BackpressureController;
  private circuitBreaker?: CircuitBreaker;

  constructor(private backendService: IBackendService) {}

  setCache(cache: LocalCache): void {
    this.cache = cache;
    logger.info('Cache enabled for orchestrator');
  }

  setMetricsCollector(collector: MetricsCollector): void {
    this.metricsCollector = collector;
    logger.info('Metrics collector enabled for orchestrator');
  }

  setBackpressure(controller: BackpressureController): void {
    this.backpressure = controller;
    logger.info('Backpressure control enabled for orchestrator');
  }

  setCircuitBreaker(breaker: CircuitBreaker): void {
    this.circuitBreaker = breaker;
    logger.info('Circuit breaker enabled for orchestrator');
  }

  registerNormalizer(sourceName: string, normalizer: IJobNormalizer): void {
    this.normalizers.set(sourceName, normalizer);
    logger.info(`Registered normalizer for ${sourceName}`);
  }

  async runSource(source: IJobSource): Promise<ScraperResult> {
    const executionId = this.metricsCollector?.startExecution(source.name) || 'unknown';
    const startTime = Date.now();
    
    const result: ScraperResult = {
      source: source.name,
      jobsFound: 0,
      jobsNormalized: 0,
      jobsSent: 0,
      errors: [],
      duration: 0,
      timestamp: new Date(),
    };

    try {
      logger.info(`Starting scrape for ${source.name}`, { executionId });

      const rawJobs = await this.fetchWithBackpressure(source);
      result.jobsFound = rawJobs.length;
      this.metricsCollector?.recordFetched(executionId, rawJobs.length);

      if (rawJobs.length === 0) {
        logger.warn(`No jobs found for ${source.name}`, { executionId });
        result.duration = Date.now() - startTime;
        await this.metricsCollector?.endExecution(executionId);
        return result;
      }

      const newJobs = this.filterCachedJobs(source.name, rawJobs, executionId);
      result.jobsFiltered = newJobs.length;
      this.metricsCollector?.recordFiltered(executionId, newJobs.length);

      logger.info(`Filtered jobs for ${source.name}`, {
        executionId,
        total: rawJobs.length,
        new: newJobs.length,
        cached: rawJobs.length - newJobs.length,
      });

      if (newJobs.length === 0) {
        logger.info(`All jobs already processed (cached) for ${source.name}`, { executionId });
        result.duration = Date.now() - startTime;
        await this.metricsCollector?.endExecution(executionId);
        return result;
      }

      const normalizer = this.normalizers.get(source.name);
      if (!normalizer) {
        throw new Error(`No normalizer registered for ${source.name}`);
      }

      const normalizedJobs = this.normalizeJobs(newJobs, normalizer, executionId, result);
      result.jobsNormalized = normalizedJobs.length;
      this.metricsCollector?.recordNormalized(executionId, normalizedJobs.length);

      const validatedJobs = normalizedJobs.filter((job) => {
        const isValid = normalizer.validateJob(job);
        if (isValid) {
          this.metricsCollector?.recordValidated(executionId, 1);
        } else {
          this.metricsCollector?.recordFailed(executionId, 1);
        }
        return isValid;
      });

      if (validatedJobs.length === 0) {
        logger.warn(`No valid jobs after normalization for ${source.name}`, { executionId });
        result.duration = Date.now() - startTime;
        await this.metricsCollector?.endExecution(executionId);
        return result;
      }

      await this.sendJobsWithCircuitBreaker(validatedJobs, source.name, executionId);
      result.jobsSent = validatedJobs.length;
      this.metricsCollector?.recordSent(executionId, validatedJobs.length);

      this.updateCache(source.name, newJobs);

      logger.info(`Successfully processed ${source.name}`, {
        executionId,
        found: result.jobsFound,
        filtered: result.jobsFiltered,
        normalized: result.jobsNormalized,
        sent: result.jobsSent,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`Failed to run source ${source.name}`, { executionId, error: errorMessage });
      result.errors.push(errorMessage);
      this.metricsCollector?.recordError(executionId, 'execution', error as Error);
      throw error;
    } finally {
      result.duration = Date.now() - startTime;
      await this.metricsCollector?.endExecution(executionId);
    }

    return result;
  }

  async runAllSources(sources: IJobSource[]): Promise<ScraperResult[]> {
    logger.info(`Running ${sources.length} sources`);

    const results = await Promise.allSettled(
      sources.map((source) => this.runSource(source))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const source = sources[index];
        return {
          source: source.name,
          jobsFound: 0,
          jobsNormalized: 0,
          jobsSent: 0,
          errors: [result.reason?.message || 'Unknown error'],
          duration: 0,
          timestamp: new Date(),
        };
      }
    });
  }

  private async fetchWithBackpressure(source: IJobSource): Promise<any[]> {
    if (this.backpressure) {
      return this.backpressure.execute(
        () => source.fetchJobs(),
        `Fetch jobs from ${source.name}`
      );
    }
    return source.fetchJobs();
  }

  private filterCachedJobs(sourceName: string, rawJobs: any[], executionId: string): any[] {
    if (!this.cache) {
      return rawJobs;
    }

    return rawJobs.filter((job) => {
      const isCached = this.cache!.has(sourceName, job.externalId);
      if (isCached) {
        this.metricsCollector?.recordCacheHit(executionId);
      } else {
        this.metricsCollector?.recordCacheMiss(executionId);
      }
      return !isCached;
    });
  }

  private normalizeJobs(
    rawJobs: any[],
    normalizer: IJobNormalizer,
    executionId: string,
    result: ScraperResult
  ): JobNormalized[] {
    return rawJobs
      .map((raw) => {
        try {
          return normalizer.normalize(raw);
        } catch (error) {
          logger.error(`Failed to normalize job ${raw.externalId}`, { executionId, error });
          result.errors.push(`Normalization error: ${(error as Error).message}`);
          this.metricsCollector?.recordError(executionId, 'normalization', error as Error);
          return null;
        }
      })
      .filter((job): job is JobNormalized => job !== null);
  }

  private async sendJobsWithCircuitBreaker(
    jobs: JobNormalized[],
    sourceName: string,
    executionId: string
  ): Promise<void> {
    const sendFn = async () => {
      await this.backendService.sendJobs(jobs);
    };

    if (this.circuitBreaker) {
      try {
        await this.circuitBreaker.execute(sendFn, `Send jobs from ${sourceName}`);
      } catch (error) {
        this.metricsCollector?.recordBackendRetry(executionId);
        throw error;
      }
    } else {
      await sendFn();
    }
  }

  private updateCache(sourceName: string, jobs: any[]): void {
    if (!this.cache) {
      return;
    }

    const externalIds = jobs.map((job) => job.externalId);
    this.cache.addBatch(sourceName, externalIds);
  }

  getStats() {
    return {
      cache: this.cache?.getStats(),
      backpressure: this.backpressure?.getStats(),
      circuitBreaker: this.circuitBreaker?.getStats(),
    };
  }
}
