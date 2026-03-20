import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

export interface ExecutionMetrics {
  executionId: string;
  source: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  
  jobsFetched: number;
  jobsFiltered: number;
  jobsNormalized: number;
  jobsValidated: number;
  jobsSent: number;
  jobsFailed: number;
  
  errors: Array<{
    phase: string;
    message: string;
    timestamp: Date;
  }>;
  
  cacheHits: number;
  cacheMisses: number;
  
  backendRetries: number;
  backendSuccess: boolean;
}

export interface AggregatedMetrics {
  period: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalJobsProcessed: number;
  totalJobsSent: number;
  averageDurationMs: number;
  errorRate: number;
  bySource: Record<string, {
    executions: number;
    jobsProcessed: number;
    jobsSent: number;
    averageDurationMs: number;
  }>;
}

export class MetricsCollector {
  private currentMetrics: Map<string, ExecutionMetrics> = new Map();
  private metricsDir: string;

  constructor(metricsDir: string = './metrics') {
    this.metricsDir = metricsDir;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.metricsDir, { recursive: true });
      logger.info('Metrics collector initialized');
    } catch (error) {
      logger.error('Failed to initialize metrics collector', error);
    }
  }

  startExecution(source: string): string {
    const executionId = `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const metrics: ExecutionMetrics = {
      executionId,
      source,
      startTime: new Date(),
      jobsFetched: 0,
      jobsFiltered: 0,
      jobsNormalized: 0,
      jobsValidated: 0,
      jobsSent: 0,
      jobsFailed: 0,
      errors: [],
      cacheHits: 0,
      cacheMisses: 0,
      backendRetries: 0,
      backendSuccess: false,
    };

    this.currentMetrics.set(executionId, metrics);
    return executionId;
  }

  recordFetched(executionId: string, count: number): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.jobsFetched = count;
    }
  }

  recordFiltered(executionId: string, count: number): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.jobsFiltered = count;
    }
  }

  recordNormalized(executionId: string, count: number): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.jobsNormalized = count;
    }
  }

  recordValidated(executionId: string, count: number): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.jobsValidated = count;
    }
  }

  recordSent(executionId: string, count: number): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.jobsSent = count;
      metrics.backendSuccess = true;
    }
  }

  recordFailed(executionId: string, count: number): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.jobsFailed = count;
    }
  }

  recordCacheHit(executionId: string): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.cacheHits++;
    }
  }

  recordCacheMiss(executionId: string): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.cacheMisses++;
    }
  }

  recordBackendRetry(executionId: string): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.backendRetries++;
    }
  }

  recordError(executionId: string, phase: string, error: Error | string): void {
    const metrics = this.currentMetrics.get(executionId);
    if (metrics) {
      metrics.errors.push({
        phase,
        message: error instanceof Error ? error.message : error,
        timestamp: new Date(),
      });
    }
  }

  async endExecution(executionId: string): Promise<ExecutionMetrics | null> {
    const metrics = this.currentMetrics.get(executionId);
    
    if (!metrics) {
      return null;
    }

    metrics.endTime = new Date();
    metrics.durationMs = metrics.endTime.getTime() - metrics.startTime.getTime();

    await this.saveMetrics(metrics);
    
    this.logMetricsSummary(metrics);
    
    this.currentMetrics.delete(executionId);
    
    return metrics;
  }

  getMetrics(executionId: string): ExecutionMetrics | undefined {
    return this.currentMetrics.get(executionId);
  }

  async getAggregatedMetrics(hours: number = 24): Promise<AggregatedMetrics> {
    const files = await this.getRecentMetricsFiles(hours);
    const allMetrics: ExecutionMetrics[] = [];

    for (const file of files) {
      try {
        const data = await fs.readFile(file, 'utf-8');
        const metrics = JSON.parse(data);
        allMetrics.push(metrics);
      } catch (error) {
        logger.warn(`Failed to read metrics file ${file}`, error);
      }
    }

    return this.aggregateMetrics(allMetrics, hours);
  }

  private logMetricsSummary(metrics: ExecutionMetrics): void {
    const summary = {
      executionId: metrics.executionId,
      source: metrics.source,
      durationMs: metrics.durationMs,
      fetched: metrics.jobsFetched,
      filtered: metrics.jobsFiltered,
      normalized: metrics.jobsNormalized,
      validated: metrics.jobsValidated,
      sent: metrics.jobsSent,
      failed: metrics.jobsFailed,
      cacheHitRate: metrics.jobsFetched > 0 
        ? ((metrics.cacheHits / metrics.jobsFetched) * 100).toFixed(2) + '%'
        : '0%',
      errors: metrics.errors.length,
      backendRetries: metrics.backendRetries,
      success: metrics.backendSuccess,
    };

    logger.info('Execution metrics', summary);
  }

  private async saveMetrics(metrics: ExecutionMetrics): Promise<void> {
    try {
      const date = new Date(metrics.startTime);
      const dateStr = date.toISOString().split('T')[0];
      const filename = `${dateStr}-${metrics.source}-${metrics.executionId}.json`;
      const filepath = path.join(this.metricsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(metrics, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save metrics', error);
    }
  }

  private async getRecentMetricsFiles(hours: number): Promise<string[]> {
    try {
      const files = await fs.readdir(this.metricsDir);
      const cutoff = Date.now() - hours * 60 * 60 * 1000;

      const recentFiles: string[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filepath = path.join(this.metricsDir, file);
        const stats = await fs.stat(filepath);

        if (stats.mtimeMs >= cutoff) {
          recentFiles.push(filepath);
        }
      }

      return recentFiles;
    } catch (error) {
      logger.warn('Failed to get recent metrics files', error);
      return [];
    }
  }

  private aggregateMetrics(metrics: ExecutionMetrics[], hours: number): AggregatedMetrics {
    const bySource: Record<string, {
      executions: number;
      jobsProcessed: number;
      jobsSent: number;
      totalDurationMs: number;
      averageDurationMs: number;
    }> = {};

    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let totalJobsProcessed = 0;
    let totalJobsSent = 0;
    let totalDurationMs = 0;

    for (const m of metrics) {
      totalExecutions++;
      totalJobsProcessed += m.jobsFetched;
      totalJobsSent += m.jobsSent;
      totalDurationMs += m.durationMs || 0;

      if (m.backendSuccess) {
        successfulExecutions++;
      } else {
        failedExecutions++;
      }

      if (!bySource[m.source]) {
        bySource[m.source] = {
          executions: 0,
          jobsProcessed: 0,
          jobsSent: 0,
          totalDurationMs: 0,
          averageDurationMs: 0,
        };
      }

      bySource[m.source].executions++;
      bySource[m.source].jobsProcessed += m.jobsFetched;
      bySource[m.source].jobsSent += m.jobsSent;
      bySource[m.source].totalDurationMs += m.durationMs || 0;
    }

    for (const source in bySource) {
      bySource[source].averageDurationMs = 
        bySource[source].totalDurationMs / bySource[source].executions;
    }

    return {
      period: `Last ${hours} hours`,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      totalJobsProcessed,
      totalJobsSent,
      averageDurationMs: totalExecutions > 0 ? totalDurationMs / totalExecutions : 0,
      errorRate: totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0,
      bySource,
    };
  }
}
