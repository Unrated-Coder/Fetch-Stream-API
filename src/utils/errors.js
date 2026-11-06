'use strict';

/**
 * Application-level error carrying an HTTP status, machine readable
 * code and optional upstream (axios) context.
 */
class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code || 'ERROR';
    this.upstreamStatus = options.upstreamStatus || null;
    this.details = options.details || null;
  }
}

/** Wrap async handlers so rejections flow into the error middleware. */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/** Normalize any upstream (axios) failure into a clean ApiError. */
function toApiError(err, fallbackMessage) {
  if (err instanceof ApiError) return err;

  const status = err.response ? err.response.status : null;

  if (status === 404) {
    return new ApiError(404, 'Target resource or page not found on the upstream source', {
      code: 'UPSTREAM_NOT_FOUND',
      upstreamStatus: 404,
      details: err.message,
    });
  }
  if (status === 403) {
    return new ApiError(502, 'Access blocked by upstream server (Cloudflare / WAF)', {
      code: 'UPSTREAM_BLOCKED',
      upstreamStatus: 403,
      details: err.message,
    });
  }
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return new ApiError(504, 'Upstream source timed out', {
      code: 'UPSTREAM_TIMEOUT',
      details: err.message,
    });
  }
  if (status) {
    return new ApiError(502, fallbackMessage || 'Upstream source returned an error', {
      code: 'UPSTREAM_ERROR',
      upstreamStatus: status,
      details: err.message,
    });
  }
  return new ApiError(502, fallbackMessage || 'Failed to reach upstream source', {
    code: 'UPSTREAM_UNREACHABLE',
    details: err.message,
  });
}

module.exports = { ApiError, asyncHandler, toApiError };
