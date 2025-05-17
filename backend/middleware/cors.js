const cors = require('cors');
const { config } = require('../config');

// Middleware de CORS
const corsMiddleware = cors({
  origin: config.security.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
});

module.exports = corsMiddleware;
