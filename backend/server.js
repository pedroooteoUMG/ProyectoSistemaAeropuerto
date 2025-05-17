require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { config } = require('./config');
const { initializePool } = require('./services/database');
const { requestLogger, errorLogger, logger } = require('./middleware/logging');
const { cacheMiddleware } = require('./middleware/cache');
const { monitoringMiddleware, responseTimeMiddleware, errorMonitoringMiddleware, auditMiddleware, sessionTrackingMiddleware } = require('./middleware/monitoring');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Monitorización
app.use(monitoringMiddleware);
app.use(responseTimeMiddleware);
app.use(auditMiddleware);
app.use(sessionTrackingMiddleware);

// Logging
app.use(requestLogger);
if (config.server.environment === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res, next) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});
app.use(limiter);

// Cache
app.use('/api/reports', cacheMiddleware(3600)); // 1 hora de cache para reportes
app.use('/api/flights', cacheMiddleware(300)); // 5 minutos de cache para vuelos
app.use('/api/bookings', cacheMiddleware(600)); // 10 minutos de cache para reservaciones

// Manejo de errores
app.use(errorLogger);
app.use(errorMonitoringMiddleware);

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/flights', require('./routes/flights'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/security', require('./routes/security'));
app.use('/api/reports', require('./routes/reports'));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Inicializar pool de conexiones
async function initialize() {
  try {
    await initializePool();
    console.log('Conexión a la base de datos establecida');
    
    const port = config.server.port;
    app.listen(port, () => {
      console.log(`Servidor escuchando en el puerto ${port}`);
    });
  } catch (error) {
    console.error('Error al inicializar el servidor:', error);
    process.exit(1);
  }
}

initialize();
