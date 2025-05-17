const expressWinston = require('express-winston');
const winston = require('winston');
const { format } = require('logform');
const { combine, timestamp, json, label } = format;
const config = require('../config/index');
const logger = require('../middleware/logging');
const database = require('../services/database');

// Configuración del logger de monitorización
const monitoringLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({ filename: 'monitoring.log' }),
    new winston.transports.File({ filename: 'monitoring-error.log', level: 'error' })
  ]
});

// Si estamos en desarrollo, también mostramos logs en consola
if (config.server.environment === 'development') {
  monitoringLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Clase de Monitorización
class Monitoring {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      activeUsers: 0,
      activeSessions: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  // Middleware de monitorización
  monitoringMiddleware() {
    return expressWinston.logger({
      transports: [
        new winston.transports.File({ filename: 'monitoring.log' })
      ],
      format: winston.format.json(),
      meta: true,
      msg: 'HTTP {{req.method}} {{req.url}}',
      colorize: true,
      statusLevels: true,
      expressFormat: true,
      ignoreRoute: function (req, res) {
        return false;
      }
    });
  }

  // Registrar métricas
  async registerMetrics() {
    try {
      // Métricas del sistema
      const memory = process.memoryUsage();
      const memoryUsage = (memory.heapUsed / memory.heapTotal) * 100;
      const cpuUsage = process.cpuUsage();

      // Actualizar métricas
      this.metrics = {
        ...this.metrics,
        memoryUsage,
        cpuUsage: cpuUsage.user + cpuUsage.system
      };

      // Guardar en base de datos
      const sql = `
        INSERT INTO AER_Metrica_Sistema (
          MET_tipo,
          MET_valor,
          MET_unidad,
          MET_fecha
        ) VALUES (
          :type,
          :value,
          :unit,
          SYSDATE
        )
      `;

      const binds = [
        { type: 'memory', value: memoryUsage, unit: '%' },
        { type: 'cpu', value: this.metrics.cpuUsage, unit: 'ms' }
      ];

      await Promise.all(binds.map(bind => executeQuery(sql, bind)));

      // Log de métricas
      monitoringLogger.info('Sistema de monitorización', {
        metrics: this.metrics,
        timestamp: new Date()
      });
    } catch (error) {
      monitoringLogger.error('Error en monitorización', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Obtener métricas del sistema
  async getSystemMetrics() {
    try {
      const sql = `
        SELECT MET_tipo, MET_valor, MET_unidad, MET_fecha
        FROM AER_Metrica_Sistema
        WHERE MET_fecha >= SYSDATE - INTERVAL '1' HOUR
        ORDER BY MET_fecha DESC
      `;

      const result = await executeQuery(sql);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener métricas: ${error.message}`);
    }
  }

  // Obtener métricas de rendimiento
  async getPerformanceMetrics() {
    try {
      const sql = `
        SELECT 
          COUNT(*) total_requests,
          AVG(MET_valor) avg_response_time,
          MAX(MET_valor) max_response_time,
          MIN(MET_valor) min_response_time,
          COUNT(CASE WHEN MET_valor > 1000 THEN 1 END) slow_requests
        FROM AER_Metrica_Rendimiento
        WHERE MET_fecha >= SYSDATE - INTERVAL '1' HOUR
      `;

      const result = await executeQuery(sql);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener métricas de rendimiento: ${error.message}`);
    }
  }

  // Obtener estadísticas de usuarios
  async getUserStatistics() {
    try {
      const sql = `
        SELECT 
          COUNT(DISTINCT USR_usuario) active_users,
          COUNT(*) total_sessions,
          AVG(SES_duracion) avg_session_duration
        FROM AER_Sesion
        WHERE SES_fecha_inicio >= SYSDATE - INTERVAL '1' DAY
      `;

      const result = await executeQuery(sql);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas de usuarios: ${error.message}`);
    }
  }

  // Obtener alertas de sistema
  async getSystemAlerts() {
    try {
      const sql = `
        SELECT A.*, M.MET_valor, M.MET_unidad
        FROM AER_Alerta_Sistema A
        JOIN AER_Metrica_Sistema M ON A.MET_metrica = M.MET_Metrica
        WHERE A.ALERT_fecha >= SYSDATE - INTERVAL '1' DAY
        ORDER BY A.ALERT_fecha DESC
      `;

      const result = await executeQuery(sql);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener alertas: ${error.message}`);
    }
  }

  // Crear alerta de sistema
  async createSystemAlert(metric, value, threshold, message) {
    try {
      const sql = `
        INSERT INTO AER_Alerta_Sistema (
          MET_metrica,
          MET_valor,
          MET_umbral,
          ALERT_mensaje,
          ALERT_fecha
        ) VALUES (
          :metric,
          :value,
          :threshold,
          :message,
          SYSDATE
        )
      `;

      const binds = {
        metric,
        value,
        threshold,
        message
      };

      await executeQuery(sql, binds);
      monitoringLogger.warn('Alerta de sistema', {
        metric,
        value,
        threshold,
        message
      });
    } catch (error) {
      monitoringLogger.error('Error al crear alerta', {
        error: error.message,
        metric,
        value,
        threshold
      });
      throw new Error(`Error al crear alerta: ${error.message}`);
    }
  }

  // Verificar umbrales y crear alertas
  async checkThresholds() {
    try {
      // Umbral de memoria
      if (this.metrics.memoryUsage > config.monitoring.memoryThreshold) {
        await this.createSystemAlert(
          'memory',
          this.metrics.memoryUsage,
          config.monitoring.memoryThreshold,
          `Uso de memoria excede el umbral (${this.metrics.memoryUsage}%)`
        );
      }

      // Umbral de CPU
      if (this.metrics.cpuUsage > config.monitoring.cpuThreshold) {
        await this.createSystemAlert(
          'cpu',
          this.metrics.cpuUsage,
          config.monitoring.cpuThreshold,
          `Uso de CPU excede el umbral (${this.metrics.cpuUsage}ms)`
        );
      }

      // Umbral de errores
      if (this.metrics.errors / this.metrics.requests > config.monitoring.errorThreshold) {
        await this.createSystemAlert(
          'error_rate',
          (this.metrics.errors / this.metrics.requests) * 100,
          config.monitoring.errorThreshold * 100,
          `Tasa de errores excede el umbral (${(this.metrics.errors / this.metrics.requests * 100).toFixed(2)}%)`
        );
      }

      // Umbral de tiempo de respuesta
      if (this.metrics.responseTimes.length > 0) {
        const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b) / this.metrics.responseTimes.length;
        if (avgResponseTime > config.monitoring.responseTimeThreshold) {
          await this.createSystemAlert(
            'response_time',
            avgResponseTime,
            config.monitoring.responseTimeThreshold,
            `Tiempo de respuesta promedio excede el umbral (${avgResponseTime.toFixed(2)}ms)`
          );
        }
      }
    } catch (error) {
      monitoringLogger.error('Error al verificar umbrales', {
        error: error.message
      });
    }
  }

  // Iniciar monitorización
  async startMonitoring() {
    try {
      // Registrar métricas iniciales
      await this.registerMetrics();

      // Configurar intervalo de registro
      setInterval(() => {
        this.registerMetrics();
        this.checkThresholds();
      }, config.monitoring.interval * 1000);

      monitoringLogger.info('Sistema de monitorización iniciado', {
        interval: config.monitoring.interval,
        thresholds: {
          memory: config.monitoring.memoryThreshold,
          cpu: config.monitoring.cpuThreshold,
          error: config.monitoring.errorThreshold,
          responseTime: config.monitoring.responseTimeThreshold
        }
      });
    } catch (error) {
      monitoringLogger.error('Error al iniciar monitorización', {
        error: error.message
      });
      throw new Error(`Error al iniciar monitorización: ${error.message}`);
    }
  }
}

module.exports = new Monitoring();
