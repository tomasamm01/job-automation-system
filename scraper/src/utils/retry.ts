import { logger } from './logger';

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoff?: boolean;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: number;
  private successCount = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - (this.lastFailureTime || 0) > this.options.resetTimeoutMs) {
        logger.info(`Circuit breaker transitioning to HALF_OPEN`, { context });
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN for ${context}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 2) {
        logger.info('Circuit breaker transitioning to CLOSED');
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      logger.warn('Circuit breaker transitioning to OPEN', {
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold,
      });
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

export function isRetryableError(error: any): boolean {
  if (!error) return false;

  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const retryableErrorCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];

  if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  if (error.code && retryableErrorCodes.includes(error.code)) {
    return true;
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  context: string
): Promise<T> {
  const { maxRetries, delayMs, backoff = true, maxDelayMs = 30000, onRetry } = options;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(error)) {
        logger.error(`${context} failed with non-retryable error`, {
          error: lastError.message,
          type: (error as any).code || 'unknown',
        });
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        logger.error(`${context} failed after ${maxRetries} attempts`, { error: lastError.message });
        throw lastError;
      }

      let delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      delay = Math.min(delay, maxDelayMs);

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      logger.warn(`${context} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`, {
        error: lastError.message,
        retryable: true,
      });

      await sleep(delay);
    }
  }

  throw lastError!;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
