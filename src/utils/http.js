'use strict';

const axios = require('axios');
const config = require('../config');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Semaphore that caps concurrent upstream requests process-wide.
 * Keeps the API polite towards scraped sources and stable under load.
 */
class Semaphore {
  constructor(max) {
    this.max = max;
    this.active = 0;
    this.waiters = [];
  }

  async acquire() {
    if (this.active < this.max) {
      this.active += 1;
      return;
    }
    await new Promise((resolve) => this.waiters.push(resolve));
    this.active += 1;
  }

  release() {
    this.active -= 1;
    const next = this.waiters.shift();
    if (next) next();
  }
}

const upstreamSlot = new Semaphore(config.upstream.maxConcurrent);

/** Browser-like headers so upstream sites serve the real HTML. */
const getHeaders = (referer) => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: referer || 'https://google.com',
});

const client = axios.create({
  timeout: config.upstream.timeoutMs,
  maxRedirects: config.upstream.maxRedirects,
  transformResponse: [(data) => data],
  validateStatus: () => true,
});

async function request(url, options, { retries, timeout }) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    await upstreamSlot.acquire();
    try {
      const res = await client.get(url, { ...options, timeout: timeout || config.upstream.timeoutMs });
      if (res.status >= 200 && res.status < 300) return res;
      const err = new Error(`Upstream responded with status ${res.status}`);
      err.response = { status: res.status };
      throw err;
    } catch (err) {
      lastError = err;
      const status = err.response ? err.response.status : null;
      const retriable = !status || status >= 500 || status === 429;
      if (!retriable || attempt === retries) break;
      await sleep(300 * (2 ** attempt));
    } finally {
      upstreamSlot.release();
    }
  }
  throw lastError;
}

/** Fetch an HTML page with retry + exponential backoff. */
function fetchHtml(url, referer, { retries = config.upstream.retries, timeout } = {}) {
  return request(url, { headers: getHeaders(referer) }, { retries, timeout })
    .then((res) => res.data);
}

/** Fetch a JSON API (e.g. TMDb) with retry + exponential backoff. */
function fetchJson(url, { retries = config.upstream.retries, timeout } = {}) {
  return request(url, {
    headers: { Accept: 'application/json' },
    responseType: 'json',
  }, { retries, timeout }).then((res) => res.data);
}

module.exports = { fetchHtml, fetchJson, getHeaders, upstreamSlot };
