export class RateLimiter {
  private queue: Array<() => void> = [];
  private activeRequests = 0;
  private lastResetTime = Date.now();
  private requestsInWindow = 0;

  constructor(
    private maxRequests: number,
    private perMilliseconds: number
  ) {}

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now();
        
        if (now - this.lastResetTime >= this.perMilliseconds) {
          this.lastResetTime = now;
          this.requestsInWindow = 0;
        }

        if (this.requestsInWindow < this.maxRequests) {
          this.requestsInWindow++;
          this.activeRequests++;
          resolve();
        } else {
          const timeToWait = this.perMilliseconds - (now - this.lastResetTime);
          setTimeout(tryAcquire, timeToWait);
        }
      };

      tryAcquire();
    });
  }

  release(): void {
    this.activeRequests--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
