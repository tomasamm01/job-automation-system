import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface CacheEntry {
  externalId: string;
  source: string;
  timestamp: number;
}

interface CacheData {
  entries: Map<string, CacheEntry>;
  lastCleanup: number;
}

export class LocalCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheFile: string;
  private ttlMs: number;
  private cleanupIntervalMs: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    cacheDir: string = './cache',
    ttlHours: number = 24,
    cleanupIntervalHours: number = 6
  ) {
    this.cacheFile = path.join(cacheDir, 'jobs-cache.json');
    this.ttlMs = ttlHours * 60 * 60 * 1000;
    this.cleanupIntervalMs = cleanupIntervalHours * 60 * 60 * 1000;
  }

  async initialize(): Promise<void> {
    try {
      await this.ensureCacheDir();
      await this.loadCache();
      this.startCleanupTimer();
      logger.info('Cache initialized', {
        entries: this.cache.size,
        ttlHours: this.ttlMs / (60 * 60 * 1000),
      });
    } catch (error) {
      logger.error('Failed to initialize cache', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    await this.saveCache();
    logger.info('Cache shutdown complete');
  }

  has(source: string, externalId: string): boolean {
    const key = this.getKey(source, externalId);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  add(source: string, externalId: string): void {
    const key = this.getKey(source, externalId);
    this.cache.set(key, {
      externalId,
      source,
      timestamp: Date.now(),
    });
  }

  addBatch(source: string, externalIds: string[]): void {
    externalIds.forEach((id) => this.add(source, id));
  }

  filterNew(source: string, externalIds: string[]): string[] {
    return externalIds.filter((id) => !this.has(source, id));
  }

  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      total: this.cache.size,
      expired: entries.filter((e) => this.isExpired(e)).length,
      bySource: entries.reduce((acc, entry) => {
        acc[entry.source] = (acc[entry.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      oldestEntry: entries.length > 0
        ? new Date(Math.min(...entries.map((e) => e.timestamp)))
        : null,
    };
  }

  async cleanup(): Promise<number> {
    const before = this.cache.size;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }

    const removed = before - this.cache.size;
    
    if (removed > 0) {
      logger.info('Cache cleanup completed', { removed, remaining: this.cache.size });
      await this.saveCache();
    }

    return removed;
  }

  private getKey(source: string, externalId: string): string {
    return `${source}:${externalId}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  private async ensureCacheDir(): Promise<void> {
    const dir = path.dirname(this.cacheFile);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const parsed = JSON.parse(data);
      
      this.cache = new Map(
        parsed.entries.map((e: CacheEntry) => [this.getKey(e.source, e.externalId), e])
      );

      await this.cleanup();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.info('No existing cache found, starting fresh');
      } else {
        logger.warn('Failed to load cache, starting fresh', { error: error.message });
      }
      this.cache = new Map();
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const data = {
        entries: Array.from(this.cache.values()),
        lastSaved: Date.now(),
      };

      await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save cache', error);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.cleanupIntervalMs);
  }
}
