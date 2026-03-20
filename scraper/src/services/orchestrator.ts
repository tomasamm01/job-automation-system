import { IJobSource, IJobNormalizer, IBackendService } from '../types/interfaces';
import { ScraperResult, JobNormalized } from '../types';
import { logger } from '../utils/logger';

export class ScraperOrchestrator {
  private normalizers: Map<string, IJobNormalizer> = new Map();

  constructor(private backendService: IBackendService) {}

  registerNormalizer(sourceName: string, normalizer: IJobNormalizer): void {
    this.normalizers.set(sourceName, normalizer);
    logger.info(`Registered normalizer for ${sourceName}`);
  }

  async runSource(source: IJobSource): Promise<ScraperResult> {
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
      logger.info(`Starting scrape for ${source.name}`);

      const rawJobs = await source.fetchJobs();
      result.jobsFound = rawJobs.length;

      if (rawJobs.length === 0) {
        logger.warn(`No jobs found for ${source.name}`);
        result.duration = Date.now() - startTime;
        return result;
      }

      const normalizer = this.normalizers.get(source.name);
      if (!normalizer) {
        throw new Error(`No normalizer registered for ${source.name}`);
      }

      const normalizedJobs = rawJobs
        .map((raw) => {
          try {
            return normalizer.normalize(raw);
          } catch (error) {
            logger.error(`Failed to normalize job ${raw.externalId}`, error);
            result.errors.push(`Normalization error: ${(error as Error).message}`);
            return null;
          }
        })
        .filter((job): job is JobNormalized => job !== null && normalizer.validateJob(job));

      result.jobsNormalized = normalizedJobs.length;

      if (normalizedJobs.length === 0) {
        logger.warn(`No valid jobs after normalization for ${source.name}`);
        result.duration = Date.now() - startTime;
        return result;
      }

      await this.backendService.sendJobs(normalizedJobs);
      result.jobsSent = normalizedJobs.length;

      logger.info(`Successfully processed ${source.name}`, {
        found: result.jobsFound,
        normalized: result.jobsNormalized,
        sent: result.jobsSent,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`Failed to run source ${source.name}`, error);
      result.errors.push(errorMessage);
      throw error;
    } finally {
      result.duration = Date.now() - startTime;
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
}
