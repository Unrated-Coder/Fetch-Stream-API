const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Main Search Endpoint
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
        // AnimeSalt Search request
        const targetUrl = `https://animesalt.ac/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        // Parsing HTML matching list items
        $('ul.post-lst li').each((index, element) => {
            const title = $(element).find('h2.entry-title').text().trim();
            const link = $(element).find('a.lnk-blk').attr('href');
            let image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

            if (image && image.startsWith('//')) {
                image = 'https:' + image;
            }

            if (title && link) {
                results.push({
                    title,
                    link,
                    image,
                    source: 'AnimeSalt'
                });
            }
        });

        res.json({ results });

    } catch (error) {
        res.status(500).json({ error: "Something went wrong while fetching data.", details: error.message });
    }
});

// App Listen for Local Testing
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
