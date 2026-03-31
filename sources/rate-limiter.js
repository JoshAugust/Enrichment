/**
 * sources/rate-limiter.js — Shared concurrency + delay rate limiter
 *
 * Enforces:
 *   - Max N concurrent web requests (default 3)
 *   - Minimum delay between request starts (default 1000ms)
 *
 * Usage:
 *   const { rateLimiter } = require('./rate-limiter');
 *   const result = await rateLimiter.run(async () => fetch(...));
 */

'use strict';

class RateLimiter {
  /**
   * @param {object} opts
   * @param {number} opts.maxConcurrent  - Max simultaneous in-flight requests
   * @param {number} opts.minDelayMs     - Min ms between request starts
   */
  constructor({ maxConcurrent = 3, minDelayMs = 1000 } = {}) {
    this.maxConcurrent = maxConcurrent;
    this.minDelayMs = minDelayMs;
    this._active = 0;
    this._queue = [];
    this._lastStarted = 0;
  }

  /**
   * Run an async fn under rate-limit constraints.
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  run(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this._queue.length > 0 && this._active < this.maxConcurrent) {
      const { fn, resolve, reject } = this._queue.shift();
      const now = Date.now();
      const wait = Math.max(0, this._lastStarted + this.minDelayMs - now);

      setTimeout(() => {
        this._active++;
        this._lastStarted = Date.now();
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this._active--;
            this._drain();
          });
      }, wait);
    }
  }
}

// Shared singleton for all sources to use
const rateLimiter = new RateLimiter({ maxConcurrent: 3, minDelayMs: 1000 });

module.exports = { RateLimiter, rateLimiter };
