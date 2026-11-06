'use strict';

/** Normalize an upstream page URL (trim + trailing slash for page routes). */
const fixUrl = (url) => {
  if (!url) return url;
  let clean = String(url).trim();
  if (!clean.endsWith('/') && !clean.includes('?')) clean += '/';
  return clean;
};

/** Resolve protocol-relative / root-relative URLs against a base. */
const absolutize = (url, base) => {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

/** Strict http(s) validation for user supplied parameters. */
const isHttpUrl = (value) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

module.exports = { fixUrl, absolutize, isHttpUrl };
