'use strict';

const TTLCache = require('../utils/cache');
const config = require('../config');

/** Process-wide cache singleton (replaced per warm container on Vercel). */
module.exports = new TTLCache({
  ttlMs: config.cache.ttlMs,
  maxEntries: config.cache.maxEntries,
});
