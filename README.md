<div align="center">

# FetchStream Pro API v2.0

**Production-grade, lazy-fetch streaming metadata & link extraction API.**
Real-time data on every request · Zero database · Integrate and build.

`GET /search` → `GET /{source}/episodes` → `GET /{source}/streams` — that's the whole workflow.

</div>

---

## ✨ What makes this "Pro"

| Feature | How it works |
|---|---|
| **True lazy fetching** | Nothing is prefetched at boot. Upstream sources are hit **only when a client requests a key that is not cached**. |
| **Smart TTL cache** | Listings 5 min · stream links 2 min (they expire fast) · TMDb artwork 24 h. In-memory, LRU-evicted — **no Redis, no DB**. |
| **Stampede protection** | 100 concurrent misses on the same key → **1 upstream request**, everyone else awaits the same promise. |
| **Resilient upstream** | Global concurrency cap (politeness), per-request timeout, retry with exponential backoff on 5xx/429. |
| **API protection** | Per-IP fixed-window rate limit, hardened security headers, configurable CORS. |
| **Self-documenting** | `GET /` returns the full endpoint index; `GET /health` reports cache stats and uptime. |
| **Unified envelope** | Every response: `{ success, data, meta: { cached, latency_ms, fetched_at } }` — perfect for front-ends. |
| **Vercel + VPS ready** | Same codebase deploys as a serverless function or a long-running Node server with graceful shutdown. |

---

## 🚀 Quick start

### Local / VPS

```bash
npm install
npm start          # http://localhost:3000
```

### Vercel (one click, no config)

```bash
npm i -g vercel
vercel
```

Set any env vars from `.env.example` in your host dashboard if you want non-defaults. **No database, no migrations, no extra services — ever.**

---

## 🔌 Endpoints

All endpoints are `GET` and lazily fetched. Append `?refresh=1` to bypass the cache and force a fresh upstream fetch.

### 1. Unified search — both sources in parallel

```http
GET /search?q=Boruto
```

```json
{
  "success": true,
  "data": {
    "query": "Boruto",
    "total": 2,
    "results": [
      { "title": "Boruto: Naruto Next Generations", "link": "https://animesalt.cx/series/...", "image": "https://image.tmdb.org/...", "type": "series", "source": "AnimeSalt" }
    ]
  },
  "meta": { "cached": false, "latency_ms": 812, "fetched_at": "2026-10-31T01:30:00.000Z" }
}
```

### 2. Episodes (seasons + grid)

```http
GET /animesalt/episodes?url=<series_page_url>
GET /toonstream/episodes?url=<series_page_url>
```

### 3. Streams & downloads

```http
GET /animesalt/streams?url=<episode_page_url>     # Base64 multi-language payloads auto-decoded
GET /toonstream/streams?url=<episode_page_url>    # ad-wall embeds bypassed, mirrors extracted
```

### 4. TMDb artwork fallback

```http
GET /tmdb/episode-thumbnail?title=Chainsaw%20Man&season=1&episode=4
```

### Meta endpoints

| Route | Purpose |
|---|---|
| `GET /` | Full machine-readable endpoint index (this is the docs) |
| `GET /health` | Uptime, cache stats, configured sources |

---

## 🧩 Building a website with it (no database)

The entire data flow is lazy by design:

```
User types "Boruto"          →  GET /search?q=Boruto        (fetched now, cached 5 min)
User clicks a series         →  GET /animesalt/episodes?url=…  (fetched now, cached 5 min)
User clicks episode 4        →  GET /animesalt/streams?url=…   (fetched now, cached 2 min)
User clicks episode 4 again  →  instant, served from cache
```

- Each response carries `meta.cached` and `meta.latency_ms` so your UI can show a "live" vs "cached" badge.
- `?refresh=1` forces fresh data — wire it to a "Reload" button.
- See `examples/demo.html` — a complete, copy-pasteable anime site in **one HTML file**. Just change `API_BASE` at the top.

```html
<script>
const API_BASE = "https://your-deployed-api.vercel.app";
const data = await (await fetch(`${API_BASE}/search?q=${q}`)).json();
// data.success, data.data.results, data.meta.cached ...
</script>
```

---

## ⚙️ Configuration (all optional)

| Env variable | Default | Purpose |
|---|---|---|
| `ANIMESALT_BASE` | `https://animesalt.cx` | Override if source changes domain |
| `TOONSTREAM_BASE` | `https://toonstream.vip` | Override if source changes domain |
| `TMDB_API_KEY` | built-in | Set your own free key from themoviedb.org |
| `CACHE_TTL_MS` | `300000` | Default cache TTL |
| `CACHE_TTL_STREAMS_MS` | `120000` | Stream endpoint TTL |
| `CACHE_TTL_TMDB_MS` | `86400000` | TMDb TTL |
| `RATE_LIMIT_MAX` | `60` | Requests per IP per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `UPSTREAM_TIMEOUT_MS` | `10000` | Upstream timeout |
| `MAX_CONCURRENT_UPSTREAM` | `8` | Global upstream concurrency cap |
| `CORS_ORIGINS` | `*` | Comma-separated origin allowlist |

---

## ❌ Error envelope

```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_BLOCKED",
    "message": "Access blocked by upstream server (Cloudflare / WAF)",
    "upstream_status": 403
  }
}
```

Codes: `VALIDATION_ERROR` (400) · `NOT_FOUND` (404) · `UPSTREAM_NOT_FOUND` (404) · `UPSTREAM_BLOCKED` (502) · `UPSTREAM_TIMEOUT` (504) · `RATE_LIMITED` (429) · `TMDB_NOT_FOUND` (404).

---

## 📁 Project structure

```
src/
├── app.js                 # Express app + middleware stack
├── index.js               # Server bootstrap + graceful shutdown (VPS mode)
├── config.js              # Env-driven configuration
├── middleware/
│   ├── security.js        # Security headers, CORS, rate limiter
│   ├── validate.js        # Declarative query validation
│   └── errorHandler.js    # 404 + unified error envelope
├── scrapers/
│   ├── animesalt.js       # Search / episodes / streams (Base64 decode)
│   ├── toonstream.js      # Search / episodes / streams (embed bypass)
│   └── tmdb.js            # Official episode stills + metadata
├── routes/                # One router per resource
├── services/cacheStore.js # Process-wide TTL cache singleton
└── utils/                 # http (retry+semaphore), cache, errors, respond, url, logger
examples/demo.html         # Single-file website integration demo
vercel.json                # Serverless deployment config
```

---

## ⚠️ Disclaimer

This API aggregates publicly available metadata and links from third-party sources for educational/demo purposes. It does not host, store, or redistribute any media content. Respect the terms of service of all upstream platforms and applicable copyright law in your jurisdiction.
