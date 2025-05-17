const { logger } = require('./logging');
const { monitoring } = require('../services/monitoring');

// Clase base para errores personalizados
class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error de validación
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// Error de autorización
class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Error de autenticación
class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// Error de recurso no encontrado
class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  try {
    // Loggear el error
    logger.error('Error en la aplicación', {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
        status: err.status
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        user: req.user ? req.user.id : 'anonymous'
      }
    });

    // Crear alerta de monitoreo
    monitoring.createSystemAlert(
      err.code || 'error',
      err.status || 500,
      0,
      `Error en ${req.method} ${req.url}: ${err.message}`
    );

    // Enviar respuesta al cliente
    res.status(err.status || 500).json({
      success: false,
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Error interno del servidor',
      details: err.details || []
    });
  } catch (error) {
    // Si hay un error al manejar el error, enviar un mensaje genérico
    res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  AuthorizationError,
  AuthenticationError,
  NotFoundError
};
