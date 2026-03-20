import cron from 'node-cron';
import { IScheduler, IJobSource } from '../types/interfaces';
import { logger } from '../utils/logger';
import { ScraperOrchestrator } from './orchestrator';

interface ScheduledJob {
  source: IJobSource;
  task: cron.ScheduledTask;
}

export class Scheduler implements IScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private orchestrator: ScraperOrchestrator;

  constructor(orchestrator: ScraperOrchestrator) {
    this.orchestrator = orchestrator;
  }

  start(): void {
    logger.info('Starting scheduler');
    
    this.jobs.forEach((job, sourceName) => {
      if (job.source.config.enabled) {
        job.task.start();
        logger.info(`Scheduled ${sourceName} with cron: ${job.source.config.schedule}`);
      } else {
        logger.info(`Skipping disabled source: ${sourceName}`);
      }
    });

    logger.info(`Scheduler started with ${this.jobs.size} sources`);
  }

  stop(): void {
    logger.info('Stopping scheduler');
    
    this.jobs.forEach((job, sourceName) => {
      job.task.stop();
      logger.info(`Stopped ${sourceName}`);
    });

    logger.info('Scheduler stopped');
  }

  addJob(source: IJobSource): void {
    if (this.jobs.has(source.name)) {
      logger.warn(`Source ${source.name} already registered, skipping`);
      return;
    }

    const task = cron.schedule(
      source.config.schedule,
      async () => {
        logger.info(`Triggering scheduled scrape for ${source.name}`);
        try {
          await this.orchestrator.runSource(source);
        } catch (error) {
          logger.error(`Scheduled scrape failed for ${source.name}`, error);
        }
      },
      {
        scheduled: false,
      }
    );

    this.jobs.set(source.name, { source, task });
    logger.info(`Registered ${source.name} with schedule: ${source.config.schedule}`);
  }

  async runNow(sourceName: string): Promise<void> {
    const job = this.jobs.get(sourceName);
    
    if (!job) {
      throw new Error(`Source ${sourceName} not found`);
    }

    logger.info(`Manual trigger for ${sourceName}`);
    await this.orchestrator.runSource(job.source);
  }

  async runAll(): Promise<void> {
    logger.info('Running all sources manually');
    
    const promises = Array.from(this.jobs.values())
      .filter(job => job.source.config.enabled)
      .map(job => this.orchestrator.runSource(job.source));

    await Promise.allSettled(promises);
  }
}
