import http from 'http';
import { logger } from '../utils/logger';
import { LocalCache } from '../cache/local-cache';
import { MetricsCollector } from '../metrics/metrics-collector';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  cache?: {
    enabled: boolean;
    entries: number;
    stats: any;
  };
  metrics?: {
    last24h: any;
  };
  sources?: {
    name: string;
    enabled: boolean;
    lastRun?: Date;
    status: string;
  }[];
}

export class HealthServer {
  private server?: http.Server;
  private port: number;
  private startTime: number;
  private cache?: LocalCache;
  private metricsCollector?: MetricsCollector;
  private sourcesStatus: Map<string, { lastRun?: Date; status: string }> = new Map();

  constructor(port: number = 3000) {
    this.port = port;
    this.startTime = Date.now();
  }

  setCache(cache: LocalCache): void {
    this.cache = cache;
  }

  setMetricsCollector(collector: MetricsCollector): void {
    this.metricsCollector = collector;
  }

  updateSourceStatus(sourceName: string, status: string, lastRun?: Date): void {
    this.sourcesStatus.set(sourceName, { lastRun, status });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        if (req.url === '/health' && req.method === 'GET') {
          await this.handleHealthCheck(req, res);
        } else if (req.url === '/metrics' && req.method === 'GET') {
          await this.handleMetrics(req, res);
        } else if (req.url === '/cache/stats' && req.method === 'GET') {
          await this.handleCacheStats(req, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });

      this.server.on('error', (error) => {
        logger.error('Health server error', error);
        reject(error);
      });

      this.server.listen(this.port, () => {
        logger.info(`Health server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Health server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async handleHealthCheck(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const health = await this.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
    } catch (error) {
      logger.error('Health check failed', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'unhealthy', error: 'Internal error' }));
    }
  }

  private async handleMetrics(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      if (!this.metricsCollector) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Metrics not available' }));
        return;
      }

      const metrics = await this.metricsCollector.getAggregatedMetrics(24);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics, null, 2));
    } catch (error) {
      logger.error('Metrics endpoint failed', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get metrics' }));
    }
  }

  private async handleCacheStats(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      if (!this.cache) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cache not available' }));
        return;
      }

      const stats = this.cache.getStats();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats, null, 2));
    } catch (error) {
      logger.error('Cache stats endpoint failed', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get cache stats' }));
    }
  }

  private async getHealthStatus(): Promise<HealthStatus> {
    const uptime = Date.now() - this.startTime;
    
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      version: '1.0.0',
    };

    if (this.cache) {
      const stats = this.cache.getStats();
      health.cache = {
        enabled: true,
        entries: stats.total,
        stats,
      };
    }

    if (this.metricsCollector) {
      try {
        const metrics = await this.metricsCollector.getAggregatedMetrics(24);
        health.metrics = {
          last24h: metrics,
        };

        if (metrics.errorRate > 50) {
          health.status = 'degraded';
        }
      } catch (error) {
        logger.warn('Failed to get metrics for health check', error);
      }
    }

    if (this.sourcesStatus.size > 0) {
      health.sources = Array.from(this.sourcesStatus.entries()).map(([name, info]) => ({
        name,
        enabled: true,
        lastRun: info.lastRun,
        status: info.status,
      }));
    }

    return health;
  }
}
