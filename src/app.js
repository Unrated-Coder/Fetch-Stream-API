'use strict';

const express = require('express');
const indexRoutes = require('./routes');
const searchRoutes = require('./routes/search');
const animesaltRoutes = require('./routes/animesalt');
const toonstreamRoutes = require('./routes/toonstream');
const tmdbRoutes = require('./routes/tmdb');
const { securityHeaders, cors, rateLimit } = require('./middleware/security');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // Correct client IPs behind proxies / Vercel

// ---- Global middleware stack ----
app.use(securityHeaders);
app.use(cors);
app.use(rateLimit);

// ---- Routes (all GET, all lazily fetched) ----
app.use('/', indexRoutes);           // GET /  +  GET /health
app.use('/search', searchRoutes);
app.use('/animesalt', animesaltRoutes);
app.use('/toonstream', toonstreamRoutes);
app.use('/tmdb', tmdbRoutes);

// ---- 404 + centralized error handling ----
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
