'use strict';

const { env } = require('../config');

const stamp = () => new Date().toISOString();

function write(level, msg, extra) {
  const line = { ts: stamp(), level, msg };
  if (extra) Object.assign(line, extra);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

module.exports = {
  info: (msg, extra) => write('info', msg, extra),
  warn: (msg, extra) => write('warn', msg, extra),
  error: (msg, extra) => write('error', msg, extra),
  debug: env === 'production' && !process.env.DEBUG
    ? () => {}
    : (msg, extra) => write('debug', msg, extra),
};
