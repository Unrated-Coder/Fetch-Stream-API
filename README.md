<div align="center">

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=waving&color=0:00f7ff,50:7928ca,100:ff007f&height=260&section=header&text=FETCHSTREAM%20API&fontSize=48&fontColor=ffffff&animation=twinkling&fontAlignY=38&desc=Serverless%20Scraper%20%7C%20Ad-Bypasser%20%7C%20TMDb%20Engine&descAlignY=60&descSize=18" width="100%"/></a>

<a href="https://t.me/Unrated_Coder">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=24&duration=2500&pause=800&color=00F7FF&center=true&vCenter=true&width=750&lines=FETCHSTREAM+API+%E2%84%A2;A+Fast+Serverless+Scraper+for+Anime+and+Toons;Bypasses+Ads+Automatically;Powered+by+Unrated+Coder" alt="Typing Animation" />
</a>

<p align="center">
  <a href="https://fetch-stream.vercel.app">
    <img src="https://img.shields.io/badge/API-Live_Base_URL-00C853?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <a href="https://t.me/Unrated_Coder">
    <img src="https://img.shields.io/badge/Telegram-Unrated_Coder-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" />
  </a>
  <a href="#!"><img src="https://img.shields.io/badge/Status-Active_Production-00f7ff?style=for-the-badge" /></a>
  <a href="#!"><img src="https://img.shields.io/badge/License-MIT-FF6B00?style=for-the-badge" /></a>
</p>

</div>

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## 📖 About FetchStream API

> [!NOTE]
> **FetchStream API** is an advanced, high-performance open-source microservice built by **Unrated Coder ™** to query, extract, and normalize streaming assets from various indexing platforms seamlessly inside a Vercel serverless environment.

<div align="center">
  <a href="#!">
    <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=700&size=22&duration=2000&pause=500&color=7928CA&center=true&vCenter=true&width=600&lines=%5B+BYPASSES+CLICK-ADS+%5D;%5B+DECODES+BASE64+STREAMS+%5D;%5B+TMDB+HD+METADATA+%5D" alt="Subtext Animation" />
  </a>
</div>

### Core System Features
- **Concurrent Multi-Site Aggregation:** Queries AnimeSalt and ToonStream simultaneously using asynchronous promise resolutions.
- **Automated Ad-Bypasser:** Crawls hidden iframe wrappers and bypasses click-ad overlays to pull pure source streams.
- **Base64 Audio Unpacking:** Automatically decodes localized audio track configurations (Hindi, Tamil, Telugu, Japanese).
- **Rich TMDb Integration:** Maps records with high-definition screenshots, official overviews, and air-dates [1].

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## 🎯 Target Platforms & Ecosystem

> [!TIP]
> **AnimeSalt (`animesalt.ac`)** > Deep series indexer, season mapper, and Base64 localized stream payloads [1].

> [!IMPORTANT]
> **ToonStream (`toon-stream.site`)** > Cartoon/anime database featuring automated background verification and ad-wall stripping [1].

> [!CAUTION]
> **TMDb Database (`themoviedb.org`)** > Official promotional art engine providing crisp backdrop images and episode titles [1].

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## 🚀 Live Production Endpoint

```text
https://fetch-stream.vercel.app
```

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## 🔌 Comprehensive API Endpoints Reference

### 1. Unified Multi-Site Search
Queries all integrated target platforms concurrently in a single thread, normalizing divergent search results into a unified payload format.

* **Endpoint:** `GET /search`
* **Query Parameter:** `q` *(String, Required)* — Target search keyword (e.g., `Boruto`, `Chainsaw Man`).

#### 📥 Sample Request
```http
GET https://fetch-stream.vercel.app/search?q=Boruto
```

#### 📤 Sample JSON Response (`200 OK`)
```json
{
  "query": "Boruto",
  "total": 2,
  "results": [
    {
      "title": "Boruto: Naruto Next Generations",
      "link": "https://animesalt.ac/series/boruto-naruto-next-generations/",
      "image": "https://image.tmdb.org/t/p/w500/e0B6i48kxdRkMcK4tR4YNfXGWOc.jpg",
      "source": "AnimeSalt"
    },
    {
      "title": "Boruto: Naruto Next Generations",
      "link": "https://toon-stream.site/series/boruto-naruto-next-generations",
      "image": "https://image.tmdb.org/t/p/w780/e0B6i48kxdRkMcK4tR4YNfXGWOc.jpg",
      "source": "ToonStream"
    }
  ]
}
```

---

### 2. Dedicated AnimeSalt Modules
* **Search Module:** `GET /animesalt/search?q=<query>`
* **Episodes & Seasons:** `GET /animesalt/episodes?url=<series_url>` *(Extracts native layout thumbnails)*
* **Stream Extractor:** `GET /animesalt/streams?url=<episode_url>` *(Decodes Base64 localized streams)*

#### 📤 Sample Response (`/animesalt/episodes`)
```json
{
  "seasons": [
    { "name": "Season 1 • 1-11 (11)", "seasonNum": "1", "postId": "2308" }
  ],
  "episodes": [
    {
      "epNum": "1",
      "title": "Daemons of the Shadow Realm 1x1",
      "link": "https://animesalt.ac/episode/daemons-of-the-shadow-realm-1x1/",
      "image": "https://img.animesalt.ac/images-unified/thumb_2308_s1e1.jpg"
    }
  ]
}
```

---

### 3. Dedicated ToonStream Modules & Ad-Bypasser
* **Search Module:** `GET /toonstream/search?q=<query>`
* **Grid Episode Extractor:** `GET /toonstream/episodes?url=<series_url>`
* **Stream & Download Resolver:** `GET /toonstream/streams?url=<episode_url>` *(Performs background ad-bypassing)*

#### 📤 Sample Response (`/toonstream/streams`)
```json
{
  "streams": [
    {
      "server": "Short",
      "link": "https://toon-stream.site/embed/81227690d56aef40",
      "is_bypassed": true
    }
  ],
  "downloads": [
    {
      "server": "Ruby",
      "link": "https://rubystm.com/d/sbsp0glxo8h1.html"
    },
    {
      "server": "GDMirror",
      "link": "https://gdmirrorbot.nl/file/ihqrdvu"
    }
  ]
}
```

---

### 4. Official TMDb Metadata & Thumbnail Service
A fallback endpoint returning crisp high-definition episode screenshots, overviews, and release timelines via structural title tracking.

* **Endpoint:** `GET /tmdb/episode-thumbnail`
* **Query Parameters:** `title` (String), `season` (Number), `episode` (Number)

#### 📥 Sample Request
```http
GET https://fetch-stream.vercel.app/tmdb/episode-thumbnail?title=Chainsaw%20Man&season=1&episode=4
```

#### 📤 Sample JSON Response (`200 OK`)
```json
{
  "found": true,
  "tv_id": 114410,
  "show_title": "Chainsaw Man",
  "episode_name": "Rescue",
  "overview": "Denji has a simple dream...",
  "air_date": "2022-11-01",
  "thumbnails": {
    "w500": "https://image.tmdb.org/t/p/w500/78p3CwjbIbJv2MucbLWnvBtF34d.jpg",
    "w780": "https://image.tmdb.org/t/p/w780/78p3CwjbIbJv2MucbLWnvBtF34d.jpg",
    "original": "https://image.tmdb.org/t/p/original/78p3CwjbIbJv2MucbLWnvBtF34d.jpg"
  }
}
```

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## 🛠️ Local Installation & Setup

To boot and test this microservice locally on your computer:

```bash
# 1. Clone repository
git clone https://github.com/your-username/fetch-stream.git

# 2. Enter workspace directory
cd fetch-stream

# 3. Install required node packages
npm install

# 4. Boot up local environment
npm start
```
*The local development server will start on `http://localhost:3000`*

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## ☁️ Serverless Deployment

Configured natively with a root-level `vercel.json` routing configuration file.
1. Connect your repository to the **[Vercel Dashboard](https://vercel.com/)**.
2. Hit **Deploy**. Vercel will compile and spin up your endpoints instantly.

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## ⚡ Tech Stack & Tools Used

<p align="center">
  <a href="#!"><img src="https://skillicons.dev/icons?i=nodejs,express,javascript,git,github,vscode,vercel,linux&perline=8" /></a>
</p>

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

## ⚠️ Disclaimer & Legal Compliance

> [!CAUTION]
> This repository is built strictly for **educational research and analytical integration**. FetchStream acts as an abstract data indexer querying public web records. It does not store, host, or re-transmit copyrighted media binaries on its own servers.

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=rect&color=0:00f7ff,50:7928ca,100:ff007f&height=4" width="100%"/></a>

<div align="center">

## Connect With The Builders

<a href="https://t.me/Unrated_Coder">
  <img src="https://img.shields.io/badge/Join_Telegram-@Unrated__Coder-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" />
</a>
&nbsp;&nbsp;
<a href="https://github.com/Unrated-Coder">
  <img src="https://img.shields.io/badge/GitHub-Unrated_Coder-181717?style=for-the-badge&logo=github&logoColor=white" />
</a>

<p><b>Star this repository if it helps your automation or development workflow!</b></p>

<a href="#!"><img src="https://capsule-render.vercel.app/api?type=waving&color=0:00f7ff,50:7928ca,100:ff007f&height=140&section=footer" width="100%"/></a>

</div>
