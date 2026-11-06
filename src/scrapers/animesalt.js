'use strict';

const cheerio = require('cheerio');
const config = require('../config');
const { fetchHtml } = require('../utils/http');
const { fixUrl, absolutize } = require('../utils/url');

const BASE = config.sources.animesalt.base;
const REFERER = config.sources.animesalt.base;

const detectType = (link, classText) => {
  if (link && link.includes('/movies/')) return 'movie';
  if (classText && classText.includes('type-movies')) return 'movie';
  return 'series';
};

/** Search AnimeSalt and normalize results. */
async function search(query) {
  const html = await fetchHtml(`${BASE}/?s=${encodeURIComponent(query)}`, REFERER);
  const $ = cheerio.load(html);
  const results = [];

  $('ul.post-lst li').each((index, element) => {
    const classText = $(element).attr('class') || '';
    const title = $(element).find('h2.entry-title').text().trim();
    let link = $(element).find('a.lnk-blk').attr('href');
    let image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

    link = link ? fixUrl(absolutize(link, BASE)) : null;
    image = image ? absolutize(image, BASE) : null;

    if (title && link) {
      results.push({
        title,
        link,
        image,
        type: detectType(link, classText),
        source: 'AnimeSalt',
      });
    }
  });

  return results;
}

/** Extract season list + episode grid from a series page. */
async function episodes(pageUrl) {
  const html = await fetchHtml(fixUrl(pageUrl), REFERER);
  const $ = cheerio.load(html);

  const seasons = [];
  const episodes = [];

  $('.season-btn').each((i, el) => {
    const name = $(el).text().trim();
    const seasonNum = $(el).attr('data-season');
    const postId = $(el).attr('data-post');
    if (seasonNum && postId) seasons.push({ name, seasonNum, postId });
  });

  $('#episode_by_temp li').each((i, element) => {
    const epNum = $(element).find('.num-epi').text().trim();
    const title = $(element).find('h2.entry-title').text().trim();
    const link = $(element).find('a.lnk-blk').attr('href');
    const image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

    if (link) {
      episodes.push({
        epNum: epNum || String(i + 1),
        title,
        link: fixUrl(absolutize(link, BASE)),
        image: image ? absolutize(image, BASE) : null,
      });
    }
  });

  return { seasons, episodes };
}

/**
 * Extract stream players + download mirrors from an episode page.
 * Decodes Base64 multi-language payloads (Hindi / Tamil / Telugu / JP).
 */
async function streams(epUrl) {
  const html = await fetchHtml(fixUrl(epUrl), REFERER);
  const $ = cheerio.load(html);

  const streamSources = [];
  const downloadSources = [];

  // Metadata + artwork
  const title = $('h1').text().trim();
  const poster = $('.post-thumbnail img').attr('src')
    || $('.post-thumbnail img').attr('data-src')
    || $('.bd img[src*="tmdb.org"]').attr('src')
    || $('.bd img').first().attr('src');
  const backdrop = $('.bghd img.TPostBg').attr('src')
    || $('.bghd img').attr('src')
    || $('.bghd img').attr('data-src');

  // Streaming players (with Base64 payload unpacking)
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
          parsedStreams.forEach((stream) => {
            streamSources.push({
              server: 'Abyss (Multi-Lang)',
              language: stream.language || 'Default',
              link: stream.link,
            });
          });
        }
      } catch {
        // Malformed payload - skip this iframe silently.
      }
    } else {
      const serverName = src.includes('as-cdn') ? 'playX' : 'Server';
      streamSources.push({ server: serverName, language: 'Default', link: src });
    }
  });

  // Download mirrors table
  $('#mdl-download .download-links table tbody tr').each((i, el) => {
    const server = $(el).find('td').first().text().replace(/#\d+\s*/g, '').trim();
    const lang = $(el).find('td:nth-child(2)').text().trim();
    const quality = $(el).find('td:nth-child(3)').text().trim();
    const link = $(el).find('a').attr('href');

    if (link) {
      downloadSources.push({
        server: server || 'Download',
        language: lang || 'Default',
        quality: quality || 'HD',
        link: fixUrl(absolutize(link, BASE)),
      });
    }
  });

  return {
    title: title || null,
    poster_image: poster ? absolutize(poster, BASE) : null,
    thumbnail_image: backdrop ? absolutize(backdrop, BASE) : null,
    streams: streamSources,
    downloads: downloadSources,
  };
}

module.exports = { search, episodes, streams };
