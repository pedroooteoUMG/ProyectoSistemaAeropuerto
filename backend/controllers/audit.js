const { Audit } = require('../models/audit');
const { authService } = require('../services/auth');
const { monitoring } = require('../services/monitoring');

// Controlador de Auditoría
class AuditController {
  // Obtener registros de auditoría
  static async getLogs(req, res) {
    try {
      const { page = 1, limit = 10, userId, ip, method, url, type, status, 
              startDate, endDate } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        ip,
        method,
        url,
        type,
        status,
        startDate,
        endDate
      };

      const logs = await Audit.getAll(filters);
      res.json({
        success: true,
        data: logs,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener logs: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs'
      });
    }
  }

  // Obtener estadísticas
  static async getStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await Audit.getStats({ startDate, endDate });
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener estadísticas: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  }

  // Obtener logs por usuario
  static async getUserLogs(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, method, url, type, status, 
              startDate, endDate } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        method,
        url,
        type,
        status,
        startDate,
        endDate
      };

      const logs = await Audit.getByUser(userId, filters);
      res.json({
        success: true,
        data: logs,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener logs por usuario: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs por usuario'
      });
    }
  }

  // Generar reporte
  static async generateReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const report = await Audit.generateReport({ startDate, endDate });
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al generar reporte: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte'
      });
    }
  }

  // Limpiar registros antiguos
  static async cleanup(req, res) {
    try {
      const { olderThanDays = 30 } = req.query;
      const deleted = await Audit.cleanup(parseInt(olderThanDays));
      res.json({
        success: true,
        message: `Se eliminaron ${deleted} registros antiguos`
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al limpiar registros: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al limpiar registros'
      });
    }
  }

  // Obtener errores
  static async getErrors(req, res) {
    try {
      const { page = 1, limit = 10, userId, method, url, startDate, endDate } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        method,
        url,
        startDate,
        endDate
      };

      const errors = await Audit.getErrors(filters);
      res.json({
        success: true,
        data: errors,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener errores: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener errores'
      });
    }
  }

  // Obtener logs por tipo
  static async getTypeLogs(req, res) {
    try {
      const { type } = req.params;
      const { page = 1, limit = 10, userId, method, url, status, 
              startDate, endDate } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        method,
        url,
        status,
        startDate,
        endDate
      };

      const logs = await Audit.getByType(type, filters);
      res.json({
        success: true,
        data: logs,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener logs por tipo: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs por tipo'
      });
    }
  }
}

module.exports = AuditController;
