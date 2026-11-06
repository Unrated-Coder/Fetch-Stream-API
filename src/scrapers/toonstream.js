'use strict';

const cheerio = require('cheerio');
const config = require('../config');
const { fetchHtml } = require('../utils/http');
const { fixUrl, absolutize } = require('../utils/url');

const BASE = config.sources.toonstream.base;
const REFERER = config.sources.toonstream.base;

const detectType = (link, classText) => {
  if (link && link.includes('/movies/')) return 'movie';
  if (classText && classText.includes('type-movies')) return 'movie';
  return 'series';
};

/** Search ToonStream and normalize results. */
async function search(query) {
  const html = await fetchHtml(`${BASE}/s?q=${encodeURIComponent(query)}`, REFERER);
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
        source: 'ToonStream',
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
    const ajaxUrl = $(el).attr('data-url');
    if (seasonNum) seasons.push({ name, seasonNum, ajaxUrl: ajaxUrl || null });
  });

  $('#episode_by_temp li').each((i, element) => {
    const epNum = $(element).find('.num-epi').text().trim();
    const title = $(element).find('h5.entry-title1').text().trim();
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
 * Embed resolver: crawls ad-wrapped iframe wrappers to reveal the
 * real player URL (or raw m3u8/mp4 when exposed in page scripts).
 */
async function resolveEmbedUrl(embedUrl) {
  try {
    const html = await fetchHtml(embedUrl, REFERER, { timeout: 4000, retries: 1 });
    const $ = cheerio.load(html);

    const nestedIframe = $('iframe').attr('src') || $('iframe').attr('data-src');
    if (nestedIframe) return nestedIframe;

    let directVideoUrl = null;
    $('script').each((i, el) => {
      const content = $(el).html();
      if (!content) return;
      const m3u8Match = content.match(/(https?:\/\/[^\s"'`]+\.m3u8[^\s"'`]*)/i);
      const mp4Match = content.match(/(https?:\/\/[^\s"'`]+\.mp4[^\s"'`]*)/i);
      if (m3u8Match) directVideoUrl = m3u8Match[1].replace(/\\/g, '');
      else if (mp4Match) directVideoUrl = mp4Match[1].replace(/\\/g, '');
    });

    return directVideoUrl || embedUrl;
  } catch {
    return embedUrl;
  }
}

/** Extract stream players + download mirrors from an episode page. */
async function streams(epUrl) {
  const html = await fetchHtml(fixUrl(epUrl), REFERER);
  const $ = cheerio.load(html);

  const rawStreams = [];
  const downloadSources = [];

  // Metadata + artwork
  const title = $('h1.entry-title').text().trim();
  const poster = $('.post-thumbnail img').attr('src') || $('.post-thumbnail img').attr('data-src');
  const backdrop = $('.bghd img.TPostBg').attr('src')
    || $('.bghd img').attr('src')
    || $('.bghd img').attr('data-src');

  // Server button -> player option mapping
  const serverMap = {};
  $('.video-options .aa-tbs-video li').each((i, el) => {
    const optionId = $(el).find('a.btn').attr('href');
    const serverName = $(el).find('.server').text().trim() || `Server ${i + 1}`;
    if (optionId) serverMap[optionId.replace('#', '')] = serverName;
  });

  // Raw embed links per option
  $('.video-player .video').each((i, el) => {
    const id = $(el).attr('id');
    let src = $(el).find('iframe').attr('src') || $(el).find('iframe').attr('data-src');
    if (!src || src === 'about:blank') return;
    src = absolutize(src, BASE);
    rawStreams.push({ serverName: serverMap[id] || `Server ${i + 1}`, link: src });
  });

  // Resolve ad-walled embeds (limited concurrency, lazy per embed)
  const resolvedStreams = await Promise.all(
    rawStreams.map(async (stream) => {
      if (stream.link.includes('/embed/')) {
        const bypassedLink = await resolveEmbedUrl(stream.link);
        return {
          server: stream.serverName,
          link: bypassedLink,
          is_bypassed: bypassedLink !== stream.link,
        };
      }
      return { server: stream.serverName, link: stream.link, is_bypassed: false };
    }),
  );

  // Download mirrors
  $('.cyber-modal .links-list .link-row').each((i, el) => {
    const serverName = $(el).find('.server-name').text().trim();
    const downloadLink = $(el).find('a.download-btn').attr('href');
    if (downloadLink) {
      downloadSources.push({
        server: serverName || `Mirror ${i + 1}`,
        link: absolutize(downloadLink, BASE),
      });
    }
  });

  return {
    title: title || null,
    poster_image: poster ? absolutize(poster, BASE) : null,
    thumbnail_image: backdrop ? absolutize(backdrop, BASE) : null,
    streams: resolvedStreams,
    downloads: downloadSources,
  };
}

module.exports = { search, episodes, streams, resolveEmbedUrl };
