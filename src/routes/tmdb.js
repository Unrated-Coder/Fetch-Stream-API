'use strict';

const express = require('express');
const config = require('../config');
const tmdb = require('../scrapers/tmdb');
const { asyncHandler, toApiError } = require('../utils/errors');
const { qTmdb } = require('../middleware/validate');
const { respond } = require('../utils/respond');

const router = express.Router();

/** GET /tmdb/episode-thumbnail?title=&season=&episode= */
router.get('/episode-thumbnail', qTmdb, asyncHandler(async (req, res) => {
  const { title, season, episode } = req.validatedQuery;
  await respond(req, res, {
    ttl: config.cache.routeTtlMs.tmdb,
    tag: 'tmdb:episode',
    producer: async () => tmdb.episodeThumbnail({ title, season, episode }).catch((err) => {
      throw toApiError(err, 'Failed to query TMDB API');
    }),
  });
}));

module.exports = router;
