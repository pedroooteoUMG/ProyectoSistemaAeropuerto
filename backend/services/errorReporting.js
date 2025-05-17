const Sentry = require('@sentry/node');
const config = require('../config/index');

// Inicializar Sentry solo si está habilitado
if (config.errorReporting && config.errorReporting.enabled) {
  Sentry.init({
    dsn: config.errorReporting.dsn,
    environment: config.server.environment,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({
        tracing: true,
        breadcrumbs: true
      })
    ]
  });
}

// Clase de Reporte de Errores
class ErrorReporting {
  constructor() {
    this.enabled = config.errorReporting.enabled;
  }

  // Reportar error
  reportError(error, context = {}) {
    if (!this.enabled) return;

    Sentry.withScope(scope => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  }

  // Reportar mensaje
  reportMessage(message, level = 'error', context = {}) {
    if (!this.enabled) return;

    Sentry.withScope(scope => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureMessage(message, level);
    });
  }

  // Middleware de reporte de errores
  errorHandler() {
    return (err, req, res, next) => {
      this.reportError(err, {
        url: req.url,
        method: req.method,
        user: req.user ? req.user.id : 'anonymous',
        ip: req.ip
      });

      next(err);
    };
  }

  // Middleware de reporte de transacciones
  transactionHandler() {
    return Sentry.Handlers.requestHandler();
  }

  // Middleware de finalización de transacciones
  transactionFinisher() {
    return Sentry.Handlers.errorHandler();
  }
}

module.exports = new ErrorReporting();
