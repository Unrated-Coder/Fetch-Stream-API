'use strict';

const express = require('express');
const config = require('../config');
const toonstream = require('../scrapers/toonstream');
const { asyncHandler, toApiError } = require('../utils/errors');
const { qSearch, qUrl } = require('../middleware/validate');
const { respond } = require('../utils/respond');

const router = express.Router();

/** GET /toonstream/search?q=<keyword> */
router.get('/search', qSearch, asyncHandler(async (req, res) => {
  const query = req.validatedQuery.q;
  await respond(req, res, {
    ttl: config.cache.ttlMs,
    tag: 'toonstream:search',
    producer: async () => {
      const results = await toonstream.search(query).catch((err) => {
        throw toApiError(err, 'Failed to search ToonStream');
      });
      return { source: 'ToonStream', query, total: results.length, results };
    },
  });
}));

/** GET /toonstream/episodes?url=<series_url> */
router.get('/episodes', qUrl, asyncHandler(async (req, res) => {
  const url = req.validatedQuery.url;
  await respond(req, res, {
    ttl: config.cache.ttlMs,
    tag: 'toonstream:episodes',
    producer: async () => toonstream.episodes(url).catch((err) => {
      throw toApiError(err, 'Failed to load episodes from ToonStream');
    }),
  });
}));

/** GET /toonstream/streams?url=<episode_url> */
router.get('/streams', qUrl, asyncHandler(async (req, res) => {
  const url = req.validatedQuery.url;
  await respond(req, res, {
    ttl: config.cache.routeTtlMs.streams,
    tag: 'toonstream:streams',
    producer: async () => toonstream.streams(url).catch((err) => {
      throw toApiError(err, 'Failed to load streams from ToonStream');
    }),
  });
}));

module.exports = router;
