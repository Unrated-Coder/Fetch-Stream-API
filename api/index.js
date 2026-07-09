const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Helper to set Request Headers (Bypassing basic checks)
const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://animesalt.ac/',
    'Accept-Language': 'en-US,en;q=0.9'
});

// 1. SEARCH ENDPOINT
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query 'q' is required" });

    try {
        const targetUrl = `https://animesalt.ac/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(targetUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const results = [];

        $('ul.post-lst li').each((index, element) => {
            const title = $(element).find('h2.entry-title').text().trim();
            const link = $(element).find('a.lnk-blk').attr('href');
            let image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

            if (image && image.startsWith('//')) image = 'https:' + image;

            if (title && link) {
                results.push({ title, link, image, source: 'AnimeSalt' });
            }
        });

        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: "Search failed", details: error.message });
    }
});

// 2. EPISODES LIST ENDPOINT
app.get('/episodes', async (req, res) => {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ error: "URL 'url' is required" });

    try {
        const { data } = await axios.get(pageUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const episodes = [];
        const seasons = [];

        // Extract Season Info (if any)
        $('.season-btn').each((index, el) => {
            const name = $(el).text().trim();
            const seasonNum = $(el).attr('data-season');
            const postId = $(el).attr('data-post');
            if (seasonNum && postId) {
                seasons.push({ name, seasonNum, postId });
            }
        });

        // Parse default loaded episodes in 'episode_by_temp'
        $('#episode_by_temp li').each((index, element) => {
            const epNum = $(element).find('.num-epi').text().trim();
            const title = $(element).find('h2.entry-title').text().trim();
            const link = $(element).find('a.lnk-blk').attr('href');
            let image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

            if (image && image.startsWith('//')) image = 'https:' + image;

            if (link) {
                episodes.push({ epNum: epNum || (index + 1).toString(), title, link });
            }
        });

        res.json({ seasons, episodes });
    } catch (error) {
        res.status(500).json({ error: "Failed to load episodes", details: error.message });
    }
});

// 2.5 OPTIONAL: GET EPISODES FOR SPECIFIC SEASON (AJAX Bypasser)
app.get('/season-episodes', async (req, res) => {
    const { postId, seasonNum } = req.query;
    if (!postId || !seasonNum) return res.status(400).json({ error: "postId and seasonNum are required" });

    try {
        const ajaxUrl = `https://animesalt.ac/wp-admin/admin-ajax.php?action=action_select_season&season=${seasonNum}&post=${postId}`;
        const { data } = await axios.get(ajaxUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const episodes = [];

        $('li').each((index, element) => {
            const epNum = $(element).find('.num-epi').text().trim();
            const title = $(element).find('h2.entry-title').text().trim();
            const link = $(element).find('a.lnk-blk').attr('href');

            if (link) {
                episodes.push({ epNum: epNum || (index + 1).toString(), title, link });
            }
        });

        res.json({ episodes });
    } catch (error) {
        res.status(500).json({ error: "Failed to load season episodes", details: error.message });
    }
});

// 3. STREAMS EXTRACTOR ENDPOINT
app.get('/streams', async (req, res) => {
    const epUrl = req.query.url;
    if (!epUrl) return res.status(400).json({ error: "URL 'url' is required" });

    try {
        const { data } = await axios.get(epUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        const streamSources = [];

        // Find all iframes under the player div
        $('#aa-options iframe').each((index, element) => {
            const src = $(element).attr('src') || $(element).attr('data-src');
            if (!src) return;

            // Type 1: Multi-language Decoded System (Secret found in ?data=)
            if (src.includes('?data=')) {
                try {
                    const urlObj = new URL(src);
                    const base64Data = urlObj.searchParams.get('data');
                    if (base64Data) {
                        const decodedJson = Buffer.from(base64Data, 'base64').toString('utf-8');
                        const parsedStreams = JSON.parse(decodedJson);
                        
                        parsedStreams.forEach(stream => {
                            streamSources.push({
                                server: 'Abyss (Multi-Lang)',
                                language: stream.language,
                                link: stream.link
                            });
                        });
                    }
                } catch (err) {
                    console.error("Base64 decoding failed for iframe data:", err.message);
                }
            } else {
                // Type 2: Direct CDN Players (e.g., playX on as-cdn*.top)
                let serverName = 'Server 1';
                if (src.includes('as-cdn')) serverName = 'playX';

                streamSources.push({
                    server: serverName,
                    language: 'Default',
                    link: src
                });
            }
        });

        res.json({ streams: streamSources });
    } catch (error) {
        res.status(500).json({ error: "Failed to extract stream links", details: error.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
