import { logger } from './utils/logger';
import { BackendService } from './services/backend-service';
import { ScraperOrchestrator } from './services/orchestrator';
import { Scheduler } from './services/scheduler';
import { RemoteOKSource, RemoteOKNormalizer } from './sources/remoteok';

async function main() {
  logger.info('=== Job Scraper Engine Starting ===');

  try {
    const backendService = new BackendService();
    
    logger.info('Checking backend health...');
    const isHealthy = await backendService.healthCheck();
    
    if (!isHealthy) {
      logger.warn('Backend health check failed, but continuing...');
    } else {
      logger.info('Backend is healthy');
    }

    const orchestrator = new ScraperOrchestrator(backendService);

    const remoteOKSource = new RemoteOKSource();
    const remoteOKNormalizer = new RemoteOKNormalizer();
    orchestrator.registerNormalizer(remoteOKSource.name, remoteOKNormalizer);

    const scheduler = new Scheduler(orchestrator);
    scheduler.addJob(remoteOKSource);

    scheduler.start();

    logger.info('=== Scraper Engine Running ===');
    logger.info('Press Ctrl+C to stop');

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Fatal error during startup', error);
    process.exit(1);
  }
}

main();
