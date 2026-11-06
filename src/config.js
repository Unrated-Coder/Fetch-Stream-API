'use strict';

/**
 * Central configuration.
 * Everything is overridable via environment variables so the exact
 * same code runs locally, on a VPS, or on Vercel with zero changes.
 */
const num = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isVercel: Boolean(process.env.VERCEL),
  port: num(process.env.PORT, 3000),

  sources: {
    animesalt: {
      id: 'animesalt',
      name: 'AnimeSalt',
      base: (process.env.ANIMESALT_BASE || 'https://animesalt.cx').replace(/\/+$/, ''),
    },
    toonstream: {
      id: 'toonstream',
      name: 'ToonStream',
      base: (process.env.TOONSTREAM_BASE || 'https://toonstream.vip').replace(/\/+$/, ''),
    },
  },

  tmdbApiKey: process.env.TMDB_API_KEY || 'ed9311c3613b06f414be99abaec5dd86',

  cache: {
    ttlMs: num(process.env.CACHE_TTL_MS, 5 * 60 * 1000),
    maxEntries: num(process.env.CACHE_MAX_ENTRIES, 500),
    // Streams expire faster than listings; TMDb artwork almost never changes.
    routeTtlMs: {
      streams: num(process.env.CACHE_TTL_STREAMS_MS, 2 * 60 * 1000),
      tmdb: num(process.env.CACHE_TTL_TMDB_MS, 24 * 60 * 60 * 1000),
    },
  },

  upstream: {
    timeoutMs: num(process.env.UPSTREAM_TIMEOUT_MS, 10000),
    maxRedirects: num(process.env.UPSTREAM_MAX_REDIRECTS, 5),
    maxConcurrent: num(process.env.MAX_CONCURRENT_UPSTREAM, 8),
    retries: num(process.env.UPSTREAM_RETRIES, 2),
  },

  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    max: num(process.env.RATE_LIMIT_MAX, 60),
  },

  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
