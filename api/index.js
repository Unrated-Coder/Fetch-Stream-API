const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Target Domain Configurations
const ANIMESALT_BASE = "https://animesalt.ac";
const TOONSTREAM_BASE = "https://toon-stream.site"; // Updated as per your live link

const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
});

// ==========================================
// 1. ANIME SALT EXTRACTOR LOGIC
// ==========================================

const searchAnimeSalt = async (query) => {
    try {
        const { data } = await axios.get(`${ANIMESALT_BASE}/?s=${encodeURIComponent(query)}`, { headers: { ...getHeaders(), 'Referer': ANIMESALT_BASE } });
        const $ = cheerio.load(data);
        const results = [];
        $('ul.post-lst li').each((index, element) => {
            const title = $(element).find('h2.entry-title').text().trim();
            let link = $(element).find('a.lnk-blk').attr('href');
            let image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

            if (image && image.startsWith('//')) image = 'https:' + image;
            if (link && !link.startsWith('http')) link = `${ANIMESALT_BASE}${link}`;

            if (title && link) {
                results.push({ title, link, image, source: 'AnimeSalt' });
            }
        });
        return results;
    } catch { return []; }
};

// ==========================================
// 2. TOON STREAM EXTRACTOR LOGIC
// ==========================================

const searchToonStream = async (query) => {
    try {
        const { data } = await axios.get(`${TOONSTREAM_BASE}/s?q=${encodeURIComponent(query)}`, { headers: { ...getHeaders(), 'Referer': TOONSTREAM_BASE } });
        const $ = cheerio.load(data);
        const results = [];
        $('ul.post-lst li').each((index, element) => {
            const title = $(element).find('h2.entry-title').text().trim();
            let link = $(element).find('a.lnk-blk').attr('href');
            let image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

            if (image && image.startsWith('//')) image = 'https:' + image;
            if (link && !link.startsWith('http')) {
                link = `${TOONSTREAM_BASE}${link.startsWith('/') ? '' : '/'}${link}`;
            }

            if (title && link) {
                results.push({ title, link, image, source: 'ToonStream' });
            }
        });
        return results;
    } catch { return []; }
};

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. COMBINED SEARCH (Search on both in one request)
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query parameter 'q' is required" });

    const [saltResults, toonResults] = await Promise.all([
        searchAnimeSalt(query),
        searchToonStream(query)
    ]);

    res.json({
        query,
        total: saltResults.length + toonResults.length,
        results: [...saltResults, ...toonResults]
    });
});

// 2. DEDICATED ANIME SALT ENDPOINTS
app.get('/animesalt/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query 'q' is required" });
    const results = await searchAnimeSalt(query);
    res.json({ source: "AnimeSalt", results });
});

app.get('/animesalt/episodes', async (req, res) => {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ error: "URL is required" });

    try {
        const { data } = await axios.get(pageUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const episodes = [];
        const seasons = [];

        $('.season-btn').each((i, el) => {
            const name = $(el).text().trim();
            const seasonNum = $(el).attr('data-season');
            const postId = $(el).attr('data-post');
            if (seasonNum && postId) seasons.push({ name, seasonNum, postId });
        });

        $('#episode_by_temp li').each((i, element) => {
            const epNum = $(element).find('.num-epi').text().trim();
            const title = $(element).find('h2.entry-title').text().trim();
            let link = $(element).find('a.lnk-blk').attr('href');
            if (link && !link.startsWith('http')) link = `${ANIMESALT_BASE}${link}`;

            if (link) episodes.push({ epNum: epNum || (i + 1).toString(), title, link });
        });

        res.json({ seasons, episodes });
    } catch (err) {
        res.status(500).json({ error: "Failed to load episodes", details: err.message });
    }
});

app.get('/animesalt/streams', async (req, res) => {
    const epUrl = req.query.url;
    if (!epUrl) return res.status(400).json({ error: "URL is required" });

    try {
        const { data } = await axios.get(epUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const streamSources = [];

        $('#aa-options iframe').each((index, element) => {
            const src = $(element).attr('src') || $(element).attr('data-src');
            if (!src) return;

            if (src.includes('?data=')) {
                try {
                    const urlObj = new URL(src);
                    const base64Data = urlObj.searchParams.get('data');
                    if (base64Data) {
                        const decodedJson = Buffer.from(base64Data, 'base64').toString('utf-8');
                        const parsedStreams = JSON.parse(decodedJson);
                        parsedStreams.forEach(stream => {
                            streamSources.push({ server: 'Abyss (Multi-Lang)', language: stream.language, link: stream.link });
                        });
                    }
                } catch {}
            } else {
                let serverName = 'Server';
                if (src.includes('as-cdn')) serverName = 'playX';
                streamSources.push({ server: serverName, language: 'Default', link: src });
            }
        });

        res.json({ streams: streamSources });
    } catch (err) {
        res.status(500).json({ error: "Failed to load streams", details: err.message });
    }
});

// 3. DEDICATED TOON STREAM ENDPOINTS
app.get('/toonstream/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query 'q' is required" });
    const results = await searchToonStream(query);
    res.json({ source: "ToonStream", results });
});

app.get('/toonstream/episodes', async (req, res) => {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ error: "URL is required" });

    try {
        const { data } = await axios.get(pageUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const episodes = [];
        const seasons = [];

        // Seasons extraction (standard to Torofilm layout)
        $('.season-btn').each((i, el) => {
            const name = $(el).text().trim();
            const seasonNum = $(el).attr('data-season');
            const url = $(el).attr('data-url');
            if (seasonNum) seasons.push({ name, seasonNum, ajaxUrl: url });
        });

        $('#episode_by_temp li').each((i, element) => {
            const epNum = $(element).find('.num-epi').text().trim();
            const title = $(element).find('h5.entry-title1').text().trim();
            let link = $(element).find('a.lnk-blk').attr('href');
            if (link && !link.startsWith('http')) {
                link = `${TOONSTREAM_BASE}${link.startsWith('/') ? '' : '/'}${link}`;
            }

            if (link) episodes.push({ epNum: epNum || (i + 1).toString(), title, link });
        });

        res.json({ seasons, episodes });
    } catch (err) {
        res.status(500).json({ error: "Failed to load episodes", details: err.message });
    }
});

app.get('/toonstream/streams', async (req, res) => {
    const epUrl = req.query.url;
    if (!epUrl) return res.status(400).json({ error: "URL is required" });

    try {
        const { data } = await axios.get(epUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const streamSources = [];
        const downloadSources = [];

        // A. Extract Embedded Streams (from Iframe/Video tabs map)
        const serverMap = {};
        $('.video-options .aa-tbs-video li').each((i, el) => {
            const optionId = $(el).find('a.btn').attr('href');
            const serverName = $(el).find('.server').text().trim() || `Server ${i + 1}`;
            if (optionId) {
                serverMap[optionId.replace('#', '')] = serverName;
            }
        });

        $('.video-player .video').each((i, el) => {
            const id = $(el).attr('id');
            let src = $(el).find('iframe').attr('src') || $(el).find('iframe').attr('data-src');
            if (!src || src === 'about:blank') return;

            if (src && src.startsWith('/')) {
                src = `${TOONSTREAM_BASE}${src}`;
            }

            const serverName = serverMap[id] || `Server ${i + 1}`;
            streamSources.push({
                server: serverName,
                link: src
            });
        });

        // B. Extract Cyberpunk Modal Direct Download Links (Bonus!)
        $('.cyber-modal .links-list .link-row').each((i, el) => {
            const serverName = $(el).find('.server-name').text().trim();
            const downloadLink = $(el).find('a.download-btn').attr('href');
            if (downloadLink) {
                downloadSources.push({
                    server: serverName || `Mirror ${i + 1}`,
                    link: downloadLink
                });
            }
        });

        res.json({
            streams: streamSources,
            downloads: downloadSources
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load streams", details: err.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
