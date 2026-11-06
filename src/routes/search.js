'use strict';

const express = require('express');
const config = require('../config');
const animesalt = require('../scrapers/animesalt');
const toonstream = require('../scrapers/toonstream');
const { asyncHandler, toApiError } = require('../utils/errors');
const { qSearch } = require('../middleware/validate');
const { respond } = require('../utils/respond');

const router = express.Router();

/**
 * GET /search?q=<keyword>
 * Queries every integrated source in parallel and normalizes results.
 * Lazy: upstream calls happen only on a cache miss.
 */
router.get('/', qSearch, asyncHandler(async (req, res) => {
  const query = req.validatedQuery.q;

  await respond(req, res, {
    ttl: config.cache.ttlMs,
    tag: 'unified-search',
    producer: async () => {
      const [saltResults, toonResults] = await Promise.all([
        animesalt.search(query).catch((err) => {
          throw toApiError(err, 'Failed to search AnimeSalt');
        }),
        toonstream.search(query).catch((err) => {
          throw toApiError(err, 'Failed to search ToonStream');
        }),
      ]);

      const results = [...saltResults, ...toonResults];
      return { query, total: results.length, results };
    },
  });
}));

module.exports = router;
