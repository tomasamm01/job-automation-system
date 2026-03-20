import { logger } from './logger';

export interface BackpressureConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  timeout: number;
}

export class BackpressureController {
  private activeCount = 0;
  private queue: Array<() => void> = [];
  private config: BackpressureConfig;

  constructor(config: BackpressureConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
    if (this.queue.length >= this.config.maxQueueSize) {
      logger.warn('Backpressure queue full, rejecting request', {
        context,
        queueSize: this.queue.length,
        maxQueueSize: this.config.maxQueueSize,
      });
      throw new Error('System overloaded: queue full');
    }

    await this.acquire();

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout);
      });

      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } finally {
      this.release();
    }
  }

  getStats() {
    return {
      activeCount: this.activeCount,
      queueSize: this.queue.length,
      maxConcurrent: this.config.maxConcurrent,
      maxQueueSize: this.config.maxQueueSize,
      utilization: (this.activeCount / this.config.maxConcurrent) * 100,
    };
  }

  private async acquire(): Promise<void> {
    if (this.activeCount < this.config.maxConcurrent) {
      this.activeCount++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  private release(): void {
    this.activeCount--;

    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.activeCount++;
      next?.();
    }
  }
}
