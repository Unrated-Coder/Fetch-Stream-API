'use strict';

const config = require('../config');
const { fetchJson } = require('../utils/http');
const { ApiError } = require('../utils/errors');

const API = 'https://api.themoviedb.org/3';
const KEY = config.tmdbApiKey;

/**
 * Official TMDb fallback service:
 * crisp HD episode stills, overviews and air-dates via title search.
 */
async function episodeThumbnail({ title, season, episode }) {
  const searchData = await fetchJson(
    `${API}/search/tv?api_key=${KEY}&query=${encodeURIComponent(title)}`,
  );

  const tvShow = searchData && searchData.results && searchData.results[0];
  if (!tvShow) {
    throw new ApiError(404, `No show found on TMDB matching '${title}'`, {
      code: 'TMDB_NOT_FOUND',
    });
  }

  const epData = await fetchJson(
    `${API}/tv/${tvShow.id}/season/${season}/episode/${episode}?api_key=${KEY}`,
  );

  if (!epData || !epData.still_path) {
    throw new ApiError(404, 'Episode found on TMDB, but no screenshot (still_path) exists for it.', {
      code: 'TMDB_NO_STILL',
    });
  }

  return {
    found: true,
    tv_id: tvShow.id,
    show_title: tvShow.name,
    episode_name: epData.name || `Episode ${episode}`,
    overview: epData.overview || '',
    air_date: epData.air_date || null,
    thumbnails: {
      w500: `https://image.tmdb.org/t/p/w500${epData.still_path}`,
      w780: `https://image.tmdb.org/t/p/w780${epData.still_path}`,
      original: `https://image.tmdb.org/t/p/original${epData.still_path}`,
    },
  };
}

module.exports = { episodeThumbnail };
