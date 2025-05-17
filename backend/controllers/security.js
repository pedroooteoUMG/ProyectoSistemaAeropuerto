const { SecurityIncident } = require('../models/security');
const { SecurityControl } = require('../models/security');
const { SecurityAlert } = require('../models/security');
const { authService } = require('../services/auth');
const { monitoring } = require('../services/monitoring');
const { cache } = require('../services/cache');

// Controlador de Seguridad
class SecurityController {
  // Obtener todos los incidentes de seguridad
  static async getIncidents(req, res) {
    try {
      const { page = 1, limit = 10, type, status, date } = req.query;
      const offset = (page - 1) * limit;

      const sql = `
        SELECT I.*, T.SIT_nombre tipo, S.EST_nombre estado,
               P.PAS_nombre, P.PAS_apellido
        FROM AER_Incidente_Seguridad I
        JOIN AER_Tipo_Incidente T ON I.SIT_tipo = T.SIT_Tipo_Incidente
        JOIN AER_Estado_Incidente S ON I.EST_estado = S.EST_Estado_Incidente
        LEFT JOIN AER_Pasajero P ON I.PAS_pasajero = P.PAS_Pasajero
        WHERE (:type IS NULL OR I.SIT_tipo = :type)
        AND (:status IS NULL OR I.EST_estado = :status)
        AND (:date IS NULL OR I.INC_fecha = :date)
        ORDER BY I.INC_fecha DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        type,
        status,
        date,
        offset,
        limit
      };

      const result = await executeQuery(sql, binds);
      const incidents = result.rows.map(row => new SecurityIncident(row));

      res.json({
        success: true,
        data: incidents,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.meta.total
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al obtener incidentes: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener incidentes'
      });
    }
  }

  // Obtener incidente por ID
  static async getIncidentById(req, res) {
    try {
      const { id } = req.params;
      const incident = await SecurityIncident.getById(id);

      if (!incident) {
        res.status(404).json({
          success: false,
          message: 'Incidente no encontrado'
        });
        return;
      }

      // Obtener detalles adicionales
      const controls = await incident.getControls();
      const alerts = await incident.getAlerts();
      const reports = await incident.getReports();

      res.json({
        success: true,
        data: {
          ...incident,
          controls,
          alerts,
          reports
        }
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al obtener incidente: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener incidente'
      });
    }
  }

  // Registrar nuevo incidente
  static async registerIncident(req, res) {
    try {
      const { user } = req;
      const incidentId = await SecurityIncident.create({
        ...req.body,
        createdBy: user.id
      });

      const incident = await SecurityIncident.getById(incidentId);
      res.status(201).json({
        success: true,
        data: incident
      });

      // Invalidar caché
      await cache.invalidateCache('security', {});

      // Crear alerta si es necesario
      if (req.body.severity >= 3) {
        await SecurityAlert.create({
          incidentId,
          severity: req.body.severity,
          description: `Nuevo incidente crítico: ${req.body.description}`,
          status: 'active'
        });
      }
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al registrar incidente: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al registrar incidente'
      });
    }
  }

  // Actualizar incidente
  static async updateIncident(req, res) {
    try {
      const { user } = req;
      const { id } = req.params;
      const incident = await SecurityIncident.getById(id);

      if (!incident) {
        res.status(404).json({
          success: false,
          message: 'Incidente no encontrado'
        });
        return;
      }

      await incident.update({
        ...req.body,
        updatedBy: user.id
      });

      const updatedIncident = await SecurityIncident.getById(id);
      res.json({
        success: true,
        data: updatedIncident
      });

      // Invalidar caché
      await cache.invalidateCache('security', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al actualizar incidente: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al actualizar incidente'
      });
    }
  }

  // Obtener controles de seguridad
  static async getControls(req, res) {
    try {
      const { page = 1, limit = 10, type, status } = req.query;
      const offset = (page - 1) * limit;

      const sql = `
        SELECT C.*, T.CTR_nombre tipo, S.EST_nombre estado
        FROM AER_Control_Seguridad C
        JOIN AER_Tipo_Control T ON C.CTR_tipo = T.CTR_Tipo_Control
        JOIN AER_Estado_Control S ON C.EST_estado = S.EST_Estado_Control
        WHERE (:type IS NULL OR C.CTR_tipo = :type)
        AND (:status IS NULL OR C.EST_estado = :status)
        ORDER BY C.CTR_fecha_creacion DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        type,
        status,
        offset,
        limit
      };

      const result = await executeQuery(sql, binds);
      const controls = result.rows.map(row => new SecurityControl(row));

      res.json({
        success: true,
        data: controls,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.meta.total
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al obtener controles: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener controles'
      });
    }
  }

  // Crear nuevo control
  static async createControl(req, res) {
    try {
      const { user } = req;
      const controlId = await SecurityControl.create({
        ...req.body,
        createdBy: user.id
      });

      const control = await SecurityControl.getById(controlId);
      res.status(201).json({
        success: true,
        data: control
      });

      // Invalidar caché
      await cache.invalidateCache('security', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al crear control: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al crear control'
      });
    }
  }

  // Obtener alertas
  static async getAlerts(req, res) {
    try {
      const { page = 1, limit = 10, severity, status } = req.query;
      const offset = (page - 1) * limit;

      const sql = `
        SELECT A.*, S.EST_nombre estado,
               I.INC_fecha fecha_incidente,
               I.INC_descripcion descripcion_incidente
        FROM AER_Alerta_Seguridad A
        JOIN AER_Estado_Alerta S ON A.EST_estado = S.EST_Estado_Alerta
        LEFT JOIN AER_Incidente_Seguridad I ON A.INC_incidente = I.INC_Incidente
        WHERE (:severity IS NULL OR A.ALE_severidad = :severity)
        AND (:status IS NULL OR A.EST_estado = :status)
        ORDER BY A.ALE_fecha DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        severity,
        status,
        offset,
        limit
      };

      const result = await executeQuery(sql, binds);
      const alerts = result.rows.map(row => new SecurityAlert(row));

      res.json({
        success: true,
        data: alerts,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.meta.total
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al obtener alertas: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener alertas'
      });
    }
  }

  // Actualizar alerta
  static async updateAlert(req, res) {
    try {
      const { id } = req.params;
      const alert = await SecurityAlert.getById(id);

      if (!alert) {
        res.status(404).json({
          success: false,
          message: 'Alerta no encontrada'
        });
        return;
      }

      await alert.update(req.body);
      res.json({
        success: true,
        message: 'Alerta actualizada exitosamente'
      });

      // Invalidar caché
      await cache.invalidateCache('security', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al actualizar alerta: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al actualizar alerta'
      });
    }
  }

  // Generar reporte de seguridad
  static async generateReport(req, res) {
    try {
      const { type, dateRange, filters } = req.body;
      const report = await SecurityIncident.generateReport(type, dateRange, filters);
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
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
}

module.exports = SecurityController;
