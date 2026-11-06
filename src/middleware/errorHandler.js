'use strict';

const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} does not exist.`,
      hint: 'GET / for the full endpoint index.',
    },
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.statusCode : 500;

  if (!isApiError || status >= 500) {
    logger.error('request failed', {
      method: req.method,
      path: req.path,
      message: err.message,
    });
  }

  res.status(status).json({
    success: false,
    error: {
      code: isApiError ? err.code : 'INTERNAL_ERROR',
      message: isApiError ? err.message : 'An unexpected internal error occurred.',
      ...(isApiError && err.upstreamStatus ? { upstream_status: err.upstreamStatus } : {}),
      ...(isApiError && err.details ? { details: err.details } : {}),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
