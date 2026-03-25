/**
 * Shared rate limiter for all enrichment sources.
 * Max 3 concurrent requests, min 1000ms between starts.
 */

interface QueueItem<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

class RateLimiter {
  private maxConcurrent: number;
  private minDelayMs: number;
  private active: number;
  private queue: QueueItem<unknown>[];
  private lastStarted: number;

  constructor({ maxConcurrent = 3, minDelayMs = 1000 } = {}) {
    this.maxConcurrent = maxConcurrent;
    this.minDelayMs = minDelayMs;
    this.active = 0;
    this.queue = [];
    this.lastStarted = 0;
  }

  run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      (this.queue as QueueItem<T>[]).push({ fn, resolve, reject });
      this.drain();
    });
  }

  private drain() {
    while (this.queue.length > 0 && this.active < this.maxConcurrent) {
      const item = this.queue.shift()!;
      const now = Date.now();
      const wait = Math.max(0, this.lastStarted + this.minDelayMs - now);

      setTimeout(() => {
        this.active++;
        this.lastStarted = Date.now();
        item
          .fn()
          .then(item.resolve)
          .catch(item.reject)
          .finally(() => {
            this.active--;
            this.drain();
          });
      }, wait);
    }
  }
}

// Shared singleton for all sources
export const rateLimiter = new RateLimiter({ maxConcurrent: 3, minDelayMs: 1000 });
