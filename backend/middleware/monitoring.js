const { monitoring } = require('../services/monitoring');
const { logger } = require('./logging');

// Middleware de monitorización
const monitoringMiddleware = (req, res, next) => {
  try {
    // Registra tiempo de inicio
    req.startTime = process.hrtime();

    // Incrementa contador de requests
    monitoring.metrics.requests++;

    // Ejecuta el middleware siguiente
    next();
  } catch (error) {
    logger.error('Error en middleware de monitorización', {
      url: req.url,
      method: req.method,
      error: error.message
    });
    next(error);
  }
};

// Middleware de cálculo de tiempo de respuesta
const responseTimeMiddleware = (req, res, next) => {
  try {
    // Calcula tiempo de respuesta
    const diff = process.hrtime(req.startTime);
    const responseTime = diff[0] * 1000 + diff[1] / 1e6;
    
    // Almacena tiempo de respuesta
    monitoring.metrics.responseTimes.push(responseTime);
    if (monitoring.metrics.responseTimes.length > 100) {
      monitoring.metrics.responseTimes.shift();
    }

    // Registra en logs
    logger.info('Tiempo de respuesta', {
      url: req.url,
      method: req.method,
      responseTime: `${responseTime.toFixed(2)}ms`
    });

    next();
  } catch (error) {
    logger.error('Error en cálculo de tiempo de respuesta', {
      url: req.url,
      method: req.method,
      error: error.message
    });
    next(error);
  }
};

// Middleware de manejo de errores
const errorMonitoringMiddleware = (error, req, res, next) => {
  try {
    // Incrementa contador de errores
    monitoring.metrics.errors++;

    // Registra error
    logger.error('Error en solicitud', {
      url: req.url,
      method: req.method,
      error: error.message,
      stack: error.stack
    });

    // Responde con error
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } catch (error) {
    logger.error('Error en manejo de errores', {
      url: req.url,
      method: req.method,
      error: error.message
    });
    res.status(500).send('Error interno del servidor');
  }
};

// Middleware de auditoría
const auditMiddleware = async (req, res, next) => {
  try {
    // Registra auditoría
    const sql = `
      INSERT INTO AER_Auditoria (
        AUD_usuario,
        AUD_ip,
        AUD_metodo,
        AUD_url,
        AUD_body,
        AUD_query,
        AUD_fecha
      ) VALUES (
        :userId,
        :ip,
        :method,
        :url,
        :body,
        :query,
        SYSDATE
      )
    `;

    const binds = {
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip,
      method: req.method,
      url: req.url,
      body: JSON.stringify(req.body),
      query: JSON.stringify(req.query)
    };

    await executeQuery(sql, binds);

    next();
  } catch (error) {
    logger.error('Error en auditoría', {
      url: req.url,
      method: req.method,
      error: error.message
    });
    next(error);
  }
};

// Middleware de seguimiento de sesiones
const sessionTrackingMiddleware = (req, res, next) => {
  try {
    // Incrementa contador de sesiones activas
    if (req.session && req.session.userId) {
      monitoring.metrics.activeSessions++;
      monitoring.metrics.activeUsers++;
    }

    next();
  } catch (error) {
    logger.error('Error en seguimiento de sesiones', {
      url: req.url,
      method: req.method,
      error: error.message
    });
    next(error);
  }
};

module.exports = {
  monitoringMiddleware,
  responseTimeMiddleware,
  errorMonitoringMiddleware,
  auditMiddleware,
  sessionTrackingMiddleware
};
