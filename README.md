# FetchStream API

A fast, lightweight, and serverless scraper API optimized for Vercel. It allows users to search, extract episode lists, and fetch embedded streaming/direct download links from **AnimeSalt** and **ToonStream**.

Because this API runs without heavy headless browsers (relying on lightweight HTTP requests and standard HTML parsing instead), it is fast, highly responsive, and fits easily inside Vercel's free serverless limitations.

---

## 🏦 Targets Information
*   **AnimeSalt** (`animesalt.ac`): An anime streaming discovery database using multiple embedded players and unique base64-encoded multi-language payloads.
*   **ToonStream** (`toon-stream.site`): A popular index of cartoon and anime series dubbed in regional languages (Hindi, Tamil, Telugu, etc.).
*   **Core Engine**: Node.js + Express + Axios + Cheerio.

---

## 🚀 Live API Base URL
```text
https://fetch-stream.vercel.app
```

---

## 🔌 API Endpoints Reference

### 1. Unified Search (Multi-Site)
Searches both AnimeSalt and ToonStream concurrently in a single API call and merges the results.

*   **Endpoint**: `/search`
*   **Method**: `GET`
*   **Query Parameters**:
    *   `q` (String, Required) - The search query (e.g., `Naruto`, `Chainsaw Man`).
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

#### B. Episodes List Extractor
Extracts the loaded episode list and season metadata from a series page.
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
          "link": "https://animesalt.ac/episode/daemons-of-the-shadow-realm-1x1/"
        }
      ]
    }
    ```

#### C. Stream Link Extractor
Parses the player iframe data and automatically decodes Base64 payloads containing localized audio streams (Hindi, Tamil, Telugu, Japanese, etc.).
*   **Endpoint**: `/animesalt/streams`
*   **Query Parameters**:
    *   `url` (String, Required) - The episode page URL.
*   **Sample Request**:
    ```text
    GET /animesalt/streams?url=https://animesalt.ac/episode/daemons-of-the-shadow-realm-1x6/
    ```
*   **Sample JSON Response**:
    ```json
    {
      "streams": [
        {
          "server": "playX",
          "language": "Default",
          "link": "https://as-cdn21.top/video/4c5bc9874d7876f9b7b6959d3c555f45"
        },
        {
          "server": "Abyss (Multi-Lang)",
          "language": "Hindi",
          "link": "https://short.icu/wNdWRnHRN"
        },
        {
          "server": "Abyss (Multi-Lang)",
          "language": "Japanese",
          "link": "https://short.icu/Ju5_XKFCw"
        }
      ]
    }
    ```

---

### 3. Dedicated ToonStream Endpoints

#### A. Dedicated Search
*   **Endpoint**: `/toonstream/search`
*   **Query Parameters**: `q` (Required)
*   **Sample Request**: `GET /toonstream/search?q=Chainsaw`

#### B. Episodes List Extractor
*   **Endpoint**: `/toonstream/episodes`
*   **Query Parameters**:
    *   `url` (String, Required) - The series page URL.
*   **Sample Request**:
    ```text
    GET /toonstream/episodes?url=https://toon-stream.site/series/chainsaw-man
    ```

#### C. Stream & Direct Downloads Extractor
Extracts embedded web players and scrapes high-speed download mirrors (such as Ruby, GDMirror, and openx bypassers) from the platform's download layout.
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
          "link": "https://toon-stream.site/embed/81227690d56aef40"
        },
        {
          "server": "Ruby",
          "link": "https://toon-stream.site/embed/9ff2f80dcb7d2bf2"
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

## 🛠️ Local Development Setup

To run this project locally on your machine, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shinubo28always/fetch-stream.git
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

1. Install the Vercel CLI or link your repository directly to the **Vercel Dashboard**.
2. Connect your GitHub repository.
3. Vercel will automatically read the root-level config files and execute deployment in seconds.

---

## ⚖️ Disclaimer & Compliance
This software is designed solely for educational research and analytical integration. The API extracts metadata and indices hosted by external third-party services on the public web. It does not store, host, or re-transmit media files directly.
```
