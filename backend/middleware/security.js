const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const config = require('../config/index');

// Configuración de seguridad
const securityMiddleware = {
  // Helmet para seguridad HTTP
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", '*.trusted-cdn.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*.trusted-cdn.com'],
        styleSrc: ["'self'", "'unsafe-inline'", '*.trusted-cdn.com'],
        imgSrc: ["'self'", 'data:', '*.trusted-cdn.com'],
        connectSrc: ["'self'", '*.trusted-cdn.com'],
        fontSrc: ["'self'", '*.trusted-cdn.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", '*.trusted-cdn.com'],
        frameSrc: ["'self'", '*.trusted-cdn.com']
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
  }),

  // Protección contra CSRF
  csrfProtection: csrf({
    cookie: true,
    value: (req) => req.header('x-csrf-token')
  }),

  // Rate limiting general
  apiLimiter: rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: 'Demasiadas peticiones. Por favor, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Rate limiting para autenticación
  authLimiter: rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: 'Demasiados intentos de autenticación. Por favor, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    methods: ['GET', 'POST']
  }),

  // Protección contra XSS
  xssProtection: (req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },

  // Protección contra clickjacking
  frameProtection: (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  },

  // Protección contra MIME-sniffing
  noSniff: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },

  // Protección contra referrer spoofing
  referrerPolicy: (req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  },

  // Protección contra HSTS
  hsts: helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true
  }),

  // Verificar acceso a rutas de seguridad
  canAccessSecurity: (req, res, next) => {
    if (!req.user || !req.user.role || !['ADMIN', 'SEGURIDAD'].includes(req.user.role.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta ruta'
      });
    }
    next();
  }
};

module.exports = securityMiddleware;
