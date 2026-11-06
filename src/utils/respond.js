'use strict';

const cache = require('../services/cacheStore');
const config = require('../config');

/** Deterministic cache key: route + sorted query params (refresh excluded). */
function cacheKey(req) {
  const params = Object.keys(req.query)
    .filter((key) => key !== 'refresh')
    .sort()
    .map((key) => `${key}=${String(req.query[key])}`)
    .join('&');
  return `${req.baseUrl}${req.path}|${params}`;
}

/**
 * The heart of the lazy-fetch architecture.
 *
 *   - Cache HIT   -> instant response, zero upstream traffic.
 *   - Cache MISS  -> the producer runs NOW, in real time, and its
 *                    result is stored for subsequent requests.
 *   - Concurrent misses share ONE upstream request (no stampedes).
 *   - ?refresh=1  -> bypass cache and force a fresh upstream fetch.
 *
 * The caller always receives the unified envelope:
 *   { success, data, meta: { cached, latency_ms, fetched_at } }
 */
async function respond(req, res, { ttl, tag, producer }) {
  const startedAt = Date.now();
  const wantsRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
  const key = cacheKey(req);

  let value;
  let cached;

  if (wantsRefresh) {
    value = await producer();
    cache.set(key, value, ttl);
    cached = false;
  } else {
    const outcome = await cache.wrap(key, ttl, producer);
    value = outcome.value;
    cached = outcome.cached;
  }

  res.json({
    success: true,
    data: value,
    meta: {
      cached,
      latency_ms: Date.now() - startedAt,
      fetched_at: new Date().toISOString(),
      ...(tag ? { tag } : {}),
    },
  });
}

module.exports = { respond, cacheKey, cache, defaultTtl: config.cache.ttlMs };
