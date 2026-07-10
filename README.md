# FetchStream API

A fast, lightweight, and serverless scraper API optimized for the Vercel serverless environment. This API allows developers to search, extract season-wise episode lists with thumbnails, and fetch ad-free streaming/direct download links from **AnimeSalt** and **ToonStream** [1].

By utilizing concurrent asynchronous tasks (Promises) and background-resolving techniques, this API automatically bypasses click-ad overlays inside embed links and returns official HD metadata using **The Movie Database (TMDb)** [1].

---

## 🏦 Targets Overview
*   **AnimeSalt** (`animesalt.ac`): An anime streaming indexing platform featuring standard players and Base64-encoded localized audio streams.
*   **ToonStream** (`toon-stream.site`): A regional cartoon and anime provider.
*   **TMDb API**: Integrates official movie database metadata and high-definition episode screenshots [1].
*   **Tech Stack**: Node.js + Express + Axios + Cheerio.

---

## 🚀 Live API Base URL
```text
https://fetch-stream.vercel.app
```

---

## 🔌 API Endpoints Reference

### 1. Unified Search (Multi-Site)
Searches both AnimeSalt and ToonStream concurrently in a single request and merges the results into a single list.

*   **Endpoint**: `/search`
*   **Method**: `GET`
*   **Query Parameters**:
    *   `q` (String, Required) - The search query (e.g., `Boruto`, `Chainsaw Man`).
*   **Sample Request**:
    ```text
    GET /search?q=Boruto
    ```
*   **Sample JSON Response**:
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

### 2. Dedicated AnimeSalt Endpoints

#### A. Dedicated Search
*   **Endpoint**: `/animesalt/search`
*   **Query Parameters**: `q` (Required)
*   **Sample Request**: `GET /animesalt/search?q=Naruto`

#### B. Episodes List Extractor (With Native HTML Screenshots)
Extracts the episode list and season metadata. This endpoint parses HTML to get direct episode thumbnail URLs.
*   **Endpoint**: `/animesalt/episodes`
*   **Query Parameters**:
    *   `url` (String, Required) - The series page URL scraped from search results.
*   **Sample Request**:
    ```text
    GET /animesalt/episodes?url=https://animesalt.ac/series/daemons-of-the-shadow-realm/
    ```
*   **Sample JSON Response**:
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

#### C. Stream Link Extractor
Parses player details and automatically decodes Base64 payloads containing localized audio streams (Hindi, Tamil, Telugu, Japanese, etc.).
*   **Endpoint**: `/animesalt/streams`
*   **Query Parameters**:
    *   `url` (String, Required) - The episode page URL.
*   **Sample Request**:
    ```text
    GET /animesalt/streams?url=https://animesalt.ac/episode/daemons-of-the-shadow-realm-1x6/
    ```

---

### 3. Dedicated ToonStream Endpoints

#### A. Dedicated Search
*   **Endpoint**: `/toonstream/search`
*   **Query Parameters**: `q` (Required)
*   **Sample Request**: `GET /toonstream/search?q=Chainsaw`

#### B. Episodes List Extractor (With Native HTML Screenshots)
Parses the episodes grid. This endpoint automatically extracts native TMDb-linked episode stills from the website structure.
*   **Endpoint**: `/toonstream/episodes`
*   **Query Parameters**:
    *   `url` (String, Required) - The series page URL.
*   **Sample Request**:
    ```text
    GET /toonstream/episodes?url=https://toon-stream.site/series/chainsaw-man
    ```
*   **Sample JSON Response**:
    ```json
    {
      "seasons": [
        { "name": "Season 1", "seasonNum": "1", "ajaxUrl": "/series/chainsaw-man/season/1" }
      ],
      "episodes": [
        {
          "epNum": "1x1",
          "title": "S 1 | E 1",
          "link": "https://toon-stream.site/episode/chainsaw-man-1x1/",
          "image": "https://image.tmdb.org/t/p/w780/dDwTq0HNQGMCpEdVQQyksvJvUcP.jpg"
        }
      ]
    }
    ```

#### C. Stream & Direct Downloads Extractor (With Automated Ad-Bypassing)
ToonStream embeds usually contain clickable ad overlays. This endpoint automatically visits those embed URLs in the background and resolves the actual underlying clean video link.

*   **Endpoint**: `/toonstream/streams`
*   **Query Parameters**:
    *   `url` (String, Required) - The ToonStream episode page URL.
*   **Sample Request**:
    ```text
    GET /toonstream/streams?url=https://toon-stream.site/episode/chainsaw-man-1x4/
    ```
*   **Sample JSON Response**:
    ```json
    {
      "streams": [
        {
          "server": "Short",
          "link": "https://toon-stream.site/embed/81227690d56aef40",
          "is_bypassed": true
        },
        {
          "server": "Ruby",
          "link": "https://raw-video-source-or-un-redirected-link.com/...",
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
A fallback endpoint to fetch high-definition official episode screenshots (still-images) and metadata directly from TMDb databases using search titles [1].

*   **Endpoint**: `/tmdb/episode-thumbnail`
*   **Method**: `GET`
*   **Query Parameters**:
    *   `title` (String, Required) - Show title (e.g., `Chainsaw Man`).
    *   `season` (Number, Required) - Season number.
    *   `episode` (Number, Required) - Episode number.
*   **Sample Request**:
    ```text
    GET /tmdb/episode-thumbnail?title=Chainsaw Man&season=1&episode=4
    ```
*   **Sample JSON Response**:
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

---

## 🛠️ Local Development Setup

To run this project locally on your machine, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/fetch-stream.git
   cd fetch-stream
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local server**:
   ```bash
   npm start
   ```
   The local development server will start on `http://localhost:3000`.

---

## ☁️ Deploying on Vercel

This API is natively configured with `vercel.json` for serverless route handling.

1. Connect your GitHub repository with the **Vercel Dashboard**.
2. Select your repository and click "Deploy".
3. Vercel will automatically read the root-level config files and execute deployment in seconds.

---

## ⚖️ Disclaimer & Compliance
This software is designed solely for educational research and analytical integration. The API extracts metadata and indices hosted by external third-party services on the public web. It does not store, host, or re-transmit media files directly.
```
