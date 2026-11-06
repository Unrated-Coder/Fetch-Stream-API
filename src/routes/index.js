'use strict';

const express = require('express');
const config = require('../config');
const cacheStore = require('../services/cacheStore');
const packageJson = require('../../package.json');

const router = express.Router();

/** Machine readable endpoint index - the API documents itself. */
const ENDPOINTS = [
  {
    method: 'GET',
    path: '/search',
    description: 'Unified multi-source search (AnimeSalt + ToonStream queried in parallel)',
    params: { q: 'string (required, 2-120 chars)' },
    example: '/search?q=Boruto',
    cache: '5 min',
  },
  {
    method: 'GET',
    path: '/animesalt/search',
    description: 'Search AnimeSalt only',
    params: { q: 'string (required, 2-120 chars)' },
    example: '/animesalt/search?q=Chainsaw%20Man',
    cache: '5 min',
  },
  {
    method: 'GET',
    path: '/animesalt/episodes',
    description: 'Seasons + episode grid for an AnimeSalt series/movie URL',
    params: { url: 'full series page URL (required)' },
    example: '/animesalt/episodes?url=https://animesalt.cx/series/boruto-naruto-next-generations/',
    cache: '5 min',
  },
  {
    method: 'GET',
    path: '/animesalt/streams',
    description: 'Stream players (Base64 multi-language payloads decoded) + download mirrors for an AnimeSalt episode URL',
    params: { url: 'full episode page URL (required)' },
    example: '/animesalt/streams?url=https://animesalt.cx/episode/.../',
    cache: '2 min',
  },
  {
    method: 'GET',
    path: '/toonstream/search',
    description: 'Search ToonStream only',
    params: { q: 'string (required, 2-120 chars)' },
    example: '/toonstream/search?q=Doraemon',
    cache: '5 min',
  },
  {
    method: 'GET',
    path: '/toonstream/episodes',
    description: 'Seasons + episode grid for a ToonStream series/movie URL',
    params: { url: 'full series page URL (required)' },
    example: '/toonstream/episodes?url=https://toon-stream.site/series/...',
    cache: '5 min',
  },
  {
    method: 'GET',
    path: '/toonstream/streams',
    description: 'Ad-wall bypassed embeds + direct download mirrors for a ToonStream episode URL',
    params: { url: 'full episode page URL (required)' },
    example: '/toonstream/streams?url=https://toon-stream.site/episode/...',
    cache: '2 min',
  },
  {
    method: 'GET',
    path: '/tmdb/episode-thumbnail',
    description: 'Official TMDb HD episode stills, overview and air-date by show title',
    params: { title: 'string (required)', season: 'int (required)', episode: 'int (required)' },
    example: '/tmdb/episode-thumbnail?title=Chainsaw%20Man&season=1&episode=4',
    cache: '24 h',
  },
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'FetchStream Pro API',
      version: packageJson.version,
      status: 'active',
      docs: 'This index IS the documentation. Every endpoint below is live and lazily fetched in real time.',
      upstream_sources: Object.values(config.sources).map((s) => ({ id: s.id, name: s.name, base: s.base })),
      features: [
        'Real-time lazy fetching - nothing is prefetched; upstream is hit only on cache miss',
        'Smart TTL cache (listings 5 min, streams 2 min, TMDb 24 h) - no database required',
        'Concurrent-request stampede protection (single upstream call per key)',
        'Retry with exponential backoff + global upstream concurrency cap',
        'Per-IP rate limiting, CORS, hardened security headers',
        'Unified response envelope with cache + latency metadata',
      ],
      usage: {
        note: "Append ?refresh=1 to any endpoint to force a fresh upstream fetch and bypass the cache.",
        envelope: {
          success: 'boolean',
          data: 'payload',
          meta: { cached: 'boolean', latency_ms: 'number', fetched_at: 'ISO-8601 timestamp' },
        },
      },
      endpoints: ENDPOINTS,
    },
  });
});

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: packageJson.version,
      env: config.env,
      uptime_s: Math.round(process.uptime()),
      upstream_sources: Object.values(config.sources).map((s) => s.base),
      cache: cacheStore.stats(),
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
