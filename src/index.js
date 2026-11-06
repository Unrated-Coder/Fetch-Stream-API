'use strict';

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info('FetchStream Pro API listening', {
    port: config.port,
    env: config.env,
    sources: Object.values(config.sources).map((s) => s.base),
  });
});

/** Graceful shutdown for VPS / container deployments. */
function shutdown(signal) {
  logger.info('shutdown signal received', { signal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
