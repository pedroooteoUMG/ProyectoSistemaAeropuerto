const rateLimit = require('express-rate-limit');

// Middleware de rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por IP
  message: 'Demasiadas peticiones. Por favor, intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // límite de 50 peticiones por IP
  message: 'Demasiados intentos de autenticación. Por favor, intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

module.exports = {
  apiLimiter,
  authLimiter
};
