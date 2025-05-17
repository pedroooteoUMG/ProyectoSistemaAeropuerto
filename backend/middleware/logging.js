const winston = require('winston');
const { format } = require('logform');
const { combine, timestamp, json } = format;

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Si estamos en desarrollo, también mostramos logs en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware de logging
const requestLogger = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const responseTime = duration[0] * 1000 + duration[1] / 1e6;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
      user: req.user ? req.user.id : 'anonymous',
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// Middleware de logging de errores
const errorLogger = (error, req, res, next) => {
  logger.error('HTTP Error', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    user: req.user ? req.user.id : 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  next(error);
};

module.exports = {
  requestLogger,
  errorLogger,
  logger
};
