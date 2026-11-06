'use strict';

const express = require('express');
const config = require('../config');
const animesalt = require('../scrapers/animesalt');
const { asyncHandler, toApiError } = require('../utils/errors');
const { qSearch, qUrl } = require('../middleware/validate');
const { respond } = require('../utils/respond');

const router = express.Router();

/** GET /animesalt/search?q=<keyword> */
router.get('/search', qSearch, asyncHandler(async (req, res) => {
  const query = req.validatedQuery.q;
  await respond(req, res, {
    ttl: config.cache.ttlMs,
    tag: 'animesalt:search',
    producer: async () => {
      const results = await animesalt.search(query).catch((err) => {
        throw toApiError(err, 'Failed to search AnimeSalt');
      });
      return { source: 'AnimeSalt', query, total: results.length, results };
    },
  });
}));

/** GET /animesalt/episodes?url=<series_url> */
router.get('/episodes', qUrl, asyncHandler(async (req, res) => {
  const url = req.validatedQuery.url;
  await respond(req, res, {
    ttl: config.cache.ttlMs,
    tag: 'animesalt:episodes',
    producer: async () => animesalt.episodes(url).catch((err) => {
      throw toApiError(err, 'Failed to load episodes from AnimeSalt');
    }),
  });
}));

/** GET /animesalt/streams?url=<episode_url> */
router.get('/streams', qUrl, asyncHandler(async (req, res) => {
  const url = req.validatedQuery.url;
  await respond(req, res, {
    ttl: config.cache.routeTtlMs.streams,
    tag: 'animesalt:streams',
    producer: async () => animesalt.streams(url).catch((err) => {
      throw toApiError(err, 'Failed to load streams from AnimeSalt');
    }),
  });
}));

module.exports = router;
