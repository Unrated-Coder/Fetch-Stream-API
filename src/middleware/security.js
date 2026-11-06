'use strict';

const config = require('../config');

/** Hardened HTTP headers for a public JSON API. */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

/**
 * Configurable CORS.
 * Default `*` (open). Set CORS_ORIGINS=https://your-site.com to lock it down.
 */
function cors(req, res, next) {
  const origin = req.headers.origin;
  const allowed = config.corsOrigins.includes('*')
    ? '*'
    : (origin && config.corsOrigins.includes(origin) ? origin : null);

  if (allowed) res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
}

/**
 * Fixed-window rate limiter keyed by client IP.
 * Protects both this API and the scraped upstream sources.
 */
const buckets = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.rateLimit.windowMs };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;

  if (bucket.count > config.rateLimit.max) {
    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
    });
  }
  return next();
}

// Sweep dead buckets so memory stays flat over long uptimes.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(ip);
  }
}, config.rateLimit.windowMs);
sweeper.unref();

module.exports = { securityHeaders, cors, rateLimit };
