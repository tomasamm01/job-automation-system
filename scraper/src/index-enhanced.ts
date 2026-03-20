import { logger } from './utils/logger';
import { BackendService } from './services/backend-service';
import { EnhancedOrchestrator } from './services/enhanced-orchestrator';
import { Scheduler } from './services/scheduler';
import { RemoteOKSource, RemoteOKNormalizer } from './sources/remoteok';
import { LocalCache } from './cache/local-cache';
import { MetricsCollector } from './metrics/metrics-collector';
import { HealthServer } from './health/health-server';
import { BackpressureController } from './utils/backpressure';
import { CircuitBreaker } from './utils/retry';

async function main() {
  logger.info('=== Enhanced Job Scraper Engine Starting ===');

  let cache: LocalCache | undefined;
  let metricsCollector: MetricsCollector | undefined;
  let healthServer: HealthServer | undefined;

  try {
    cache = new LocalCache('./cache', 24, 6);
    await cache.initialize();

    metricsCollector = new MetricsCollector('./metrics');
    await metricsCollector.initialize();

    const backendService = new BackendService();
    
    logger.info('Checking backend health...');
    const isHealthy = await backendService.healthCheck();
    
    if (!isHealthy) {
      logger.warn('Backend health check failed, but continuing...');
    } else {
      logger.info('Backend is healthy');
    }

    const orchestrator = new EnhancedOrchestrator(backendService);
    
    orchestrator.setCache(cache);
    orchestrator.setMetricsCollector(metricsCollector);
    
    const backpressure = new BackpressureController({
      maxConcurrent: 3,
      maxQueueSize: 10,
      timeout: 60000,
    });
    orchestrator.setBackpressure(backpressure);

    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 60000,
    });
    orchestrator.setCircuitBreaker(circuitBreaker);

    const remoteOKSource = new RemoteOKSource();
    const remoteOKNormalizer = new RemoteOKNormalizer();
    orchestrator.registerNormalizer(remoteOKSource.name, remoteOKNormalizer);

    const scheduler = new Scheduler(orchestrator);
    scheduler.addJob(remoteOKSource);

    healthServer = new HealthServer(3000);
    healthServer.setCache(cache);
    healthServer.setMetricsCollector(metricsCollector);
    await healthServer.start();

    scheduler.start();

    logger.info('=== Enhanced Scraper Engine Running ===');
    logger.info('Health endpoint: http://localhost:3000/health');
    logger.info('Metrics endpoint: http://localhost:3000/metrics');
    logger.info('Cache stats endpoint: http://localhost:3000/cache/stats');
    logger.info('Press Ctrl+C to stop');

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      scheduler.stop();
      await healthServer?.stop();
      await cache?.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      scheduler.stop();
      await healthServer?.stop();
      await cache?.shutdown();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Fatal error during startup', error);
    await healthServer?.stop();
    await cache?.shutdown();
    process.exit(1);
  }
}

main();
