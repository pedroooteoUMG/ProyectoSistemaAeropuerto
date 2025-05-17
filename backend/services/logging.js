const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { config } = require('../config');

// Formato para logs
const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Transportes para logs
const transports = [
  // Logs de error
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format
  }),
  // Logs combinados
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format
  }),
  // Logs de seguridad
  new DailyRotateFile({
    filename: 'logs/security-%DATE%.log',
    level: 'info',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format
  })
];

// Si estamos en desarrollo, agregar logs a consola
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  exitOnError: false
});

// Logs por niveles
const log = {
  info: (message, meta = {}) => logger.info(message, { ...meta, type: 'info' }),
  error: (message, meta = {}) => logger.error(message, { ...meta, type: 'error' }),
  warn: (message, meta = {}) => logger.warn(message, { ...meta, type: 'warn' }),
  debug: (message, meta = {}) => logger.debug(message, { ...meta, type: 'debug' }),
  security: (message, meta = {}) => logger.info(message, { ...meta, type: 'security' }),
  performance: (message, meta = {}) => logger.info(message, { ...meta, type: 'performance' })
};

// Middleware de logging
const requestLogger = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const responseTime = duration[0] * 1000 + duration[1] / 1e6;
    
    log.performance('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
      user: req.user ? req.user.id : 'anonymous',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// Middleware de logging de errores
const errorLogger = (error, req, res, next) => {
  log.error('HTTP Error', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    user: req.user ? req.user.id : 'anonymous',
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  next(error);
};

// Middleware de logging de seguridad
const securityLogger = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/auth/login') {
    log.security('Login attempt', {
      success: req.user ? true : false,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  logger,
  log,
  requestLogger,
  errorLogger,
  securityLogger
};
