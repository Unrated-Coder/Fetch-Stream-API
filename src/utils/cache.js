'use strict';

/**
 * In-memory TTL cache with LRU eviction and stampede protection.
 *
 * Design goals (this is what makes the API "lazy but fast"):
 *   - NOTHING is prefetched at boot. An upstream call only happens
 *     when a real client asks for a key that is not cached.
 *   - Concurrent misses on the same key trigger ONE upstream request;
 *     every other request awaits the same in-flight promise.
 *   - Entries auto-expire via per-key TTL, so data stays "real time"
 *     without any database or cache server.
 */
class TTLCache {
  constructor({ ttlMs, maxEntries }) {
    this.defaultTtlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.store = new Map();      // key -> { value, expires }
    this.inflight = new Map();   // key -> Promise
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    // LRU touch: re-insert so Map iteration order reflects recency.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  /**
   * Lazy fetch wrapper:
   *   hit      -> { value, cached: true }
   *   miss     -> producer() runs once, result stored, { value, cached: false }
   *   concurrent miss -> all callers share one producer() invocation
   */
  async wrap(key, ttlMs, producer) {
    const hit = this.get(key);
    if (hit !== null && hit !== undefined) {
      return { value: hit, cached: true };
    }

    if (this.inflight.has(key)) {
      const value = await this.inflight.get(key);
      return { value, cached: true };
    }

    const pending = Promise.resolve()
      .then(producer)
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, pending);

    const value = await pending;
    this.set(key, value, ttlMs);
    return { value, cached: false };
  }

  clear() {
    this.store.clear();
  }

  stats() {
    return { entries: this.store.size, inflight: this.inflight.size };
  }
}

module.exports = TTLCache;
