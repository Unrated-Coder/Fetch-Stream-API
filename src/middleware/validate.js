'use strict';

const { ApiError } = require('../utils/errors');
const { isHttpUrl } = require('../utils/url');

/**
 * Declarative query-string validation.
 *
 *   spec = {
 *     q:     { required: true, type: 'string', min: 2, max: 120 },
 *     url:   { required: true, type: 'url' },
 *     season:{ required: true, type: 'int' },
 *   }
 *
 * Validated values land on `req.validatedQuery`.
 */
function validateQuery(spec) {
  return (req, res, next) => {
    const errors = [];
    const values = {};

    for (const [name, rule] of Object.entries(spec)) {
      const raw = req.query[name];
      const missing = raw === undefined || raw === null || String(raw).trim() === '';

      if (missing) {
        if (rule.required) errors.push(`'${name}' is required`);
        continue;
      }

      const str = String(raw).trim();

      if (rule.min && str.length < rule.min) {
        errors.push(`'${name}' must be at least ${rule.min} characters`);
      }
      if (rule.max && str.length > rule.max) {
        errors.push(`'${name}' must be at most ${rule.max} characters`);
      }

      let value = str;
      if (rule.type === 'int') {
        const n = Number(str);
        if (!Number.isInteger(n) || n < 1) {
          errors.push(`'${name}' must be a positive integer`);
        } else {
          value = n;
        }
      }
      if (rule.type === 'url' && !isHttpUrl(str)) {
        errors.push(`'${name}' must be a valid http(s) URL`);
      }

      values[name] = value;
    }

    if (errors.length) {
      return next(new ApiError(400, `Invalid request: ${errors.join('; ')}`, {
        code: 'VALIDATION_ERROR',
        details: errors,
      }));
    }

    req.validatedQuery = values;
    return next();
  };
}

// ---- Reusable validators for the public routes ----
const qSearch = validateQuery({
  q: { required: true, type: 'string', min: 2, max: 120 },
});

const qUrl = validateQuery({
  url: { required: true, type: 'url', max: 2048 },
});

const qTmdb = validateQuery({
  title: { required: true, type: 'string', min: 1, max: 200 },
  season: { required: true, type: 'int' },
  episode: { required: true, type: 'int' },
});

module.exports = { validateQuery, qSearch, qUrl, qTmdb };
