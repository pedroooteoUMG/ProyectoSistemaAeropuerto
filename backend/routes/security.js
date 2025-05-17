const express = require('express');
const router = express.Router();
const { executeQuery, executeProcedure } = require('../services/database');
const { authenticate, authorize } = require('../middleware/auth');
const { canAccessSecurity } = require('../middleware/security');

// Obtener incidentes de seguridad
router.get('/incidents', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { date, status } = req.query;
    const sql = `
      SELECT I.*, P.PAS_nombre, P.PAS_apellido, E.EMP_nombre
      FROM AER_Incidente I
      LEFT JOIN AER_Pasajero P ON I.PAS_pasajero = P.PAS_Pasajero
      LEFT JOIN AER_Empleado E ON I.EMP_Empleado = E.EMP_Empleado
      WHERE (:date IS NULL OR I.INS_fecha = :date)
      AND (:status IS NULL OR I.INS_estado = :status)
      ORDER BY I.INS_fecha DESC
    `;
    
    const result = await executeQuery(sql, [date, status]);
    res.json({
      success: true,
      incidents: result.rows
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo incidente de seguridad
router.post('/incidents', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { pasajero, empleado, descripcion, ubicacion, severidad } = req.body;

    const procedure = `
      BEGIN
        AER_Incidente_Package.create_incident(
          :incidentId,
          :pasajero,
          :empleado,
          :descripcion,
          :ubicacion,
          :severidad
        );
      END;
    `;

    const binds = {
      incidentId: { type: 'STRING', dir: 'BIND_OUT' },
      pasajero,
      empleado,
      descripcion,
      ubicacion,
      severidad
    };

    await executeProcedure(procedure, binds);
    
    res.status(201).json({
      success: true,
      message: 'Incidente creado exitosamente',
      incidentId: binds.incidentId.value
    });
  } catch (error) {
    console.error('Error al crear incidente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar incidente
router.put('/incidents/:id', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, descripcion, ubicacion, severidad } = req.body;

    const procedure = `
      BEGIN
        AER_Incidente_Package.update_incident(
          :incidentId,
          :estado,
          :descripcion,
          :ubicacion,
          :severidad
        );
      END;
    `;

    const binds = {
      incidentId: id,
      estado,
      descripcion,
      ubicacion,
      severidad
    };

    await executeProcedure(procedure, binds);
    
    res.json({
      success: true,
      message: 'Incidente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar incidente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener controles de seguridad
router.get('/controls', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { date, type } = req.query;
    const sql = `
      SELECT C.*, P.PAS_nombre, P.PAS_apellido, E.EMP_nombre
      FROM AER_Control_Seguridad C
      LEFT JOIN AER_Pasajero P ON C.PAS_pasajero = P.PAS_Pasajero
      LEFT JOIN AER_Empleado E ON C.EMP_Empleado = E.EMP_Empleado
      WHERE (:date IS NULL OR C.SEG_fecha_hora >= :date)
      AND (:type IS NULL OR C.SEG_tipo = :type)
      ORDER BY C.SEG_fecha_hora DESC
    `;
    
    const result = await executeQuery(sql, [date, type]);
    res.json({
      success: true,
      controls: result.rows
    });
  } catch (error) {
    console.error('Error al obtener controles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo control
router.post('/controls', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { pasajero, empleado, tipo, descripcion, resultado } = req.body;

    const procedure = `
      BEGIN
        AER_Control_Seguridad_Package.create_control(
          :controlId,
          :pasajero,
          :empleado,
          :tipo,
          :descripcion,
          :resultado
        );
      END;
    `;

    const binds = {
      controlId: { type: 'STRING', dir: 'BIND_OUT' },
      pasajero,
      empleado,
      tipo,
      descripcion,
      resultado
    };

    await executeProcedure(procedure, binds);
    
    res.status(201).json({
      success: true,
      message: 'Control creado exitosamente',
      controlId: binds.controlId.value
    });
  } catch (error) {
    console.error('Error al crear control:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener alertas
router.get('/alerts', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { date, status } = req.query;
    const sql = `
      SELECT A.*, P.PAS_nombre, P.PAS_apellido
      FROM AER_Alerta_Seguridad A
      LEFT JOIN AER_Pasajero P ON A.PAS_pasajero = P.PAS_Pasajero
      WHERE (:date IS NULL OR A.ALERT_fecha = :date)
      AND (:status IS NULL OR A.ALERT_estado = :status)
      ORDER BY A.ALERT_fecha DESC
    `;
    
    const result = await executeQuery(sql, [date, status]);
    res.json({
      success: true,
      alerts: result.rows
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar alerta
router.put('/alerts/:id', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, descripcion } = req.body;

    const procedure = `
      BEGIN
        AER_Alerta_Seguridad_Package.update_alert(
          :alertId,
          :estado,
          :descripcion
        );
      END;
    `;

    const binds = {
      alertId: id,
      estado,
      descripcion
    };

    await executeProcedure(procedure, binds);
    
    res.json({
      success: true,
      message: 'Alerta actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar reporte de seguridad
router.post('/reports', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.body;

    const sql = `
      SELECT 
        COUNT(*) as total_incidents,
        SUM(CASE WHEN INS_severidad = 'ALTA' THEN 1 ELSE 0 END) as high_severity,
        SUM(CASE WHEN INS_severidad = 'MEDIA' THEN 1 ELSE 0 END) as medium_severity,
        SUM(CASE WHEN INS_severidad = 'BAJA' THEN 1 ELSE 0 END) as low_severity,
        AVG(CASE WHEN INS_severidad = 'ALTA' THEN 1 ELSE 0 END) as avg_high_severity
      FROM AER_Incidente
      WHERE (:startDate IS NULL OR INS_fecha >= :startDate)
      AND (:endDate IS NULL OR INS_fecha <= :endDate)
      AND (:type IS NULL OR INS_tipo = :type)
    `;

    const result = await executeQuery(sql, [startDate, endDate, type]);
    res.json({
      success: true,
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener controles de seguridad por vuelo
router.get('/flight-controls/:flightId', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { flightId } = req.params;
    const sql = `
      SELECT C.*, P.PAS_nombre, P.PAS_apellido, E.EMP_nombre
      FROM AER_Control_Seguridad C
      LEFT JOIN AER_Pasajero P ON C.PAS_pasajero = P.PAS_Pasajero
      LEFT JOIN AER_Empleado E ON C.EMP_Empleado = E.EMP_Empleado
      WHERE C.VUE_vuelo = :flightId
      ORDER BY C.SEG_fecha_hora DESC
    `;
    
    const result = await executeQuery(sql, [flightId]);
    res.json({
      success: true,
      controls: result.rows
    });
  } catch (error) {
    console.error('Error al obtener controles de vuelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Registrar control de seguridad
router.post('/flight-security', authenticate, canAccessSecurity, async (req, res) => {
  try {
    const { pasajero, vuelo, estado, notas } = req.body;

    const procedure = `
      BEGIN
        AER_Control_Seguridad_Package.register_control(
          :controlId,
          :pasajero,
          :vuelo,
          :empleado,
          :estado,
          :notas
        );
      END;
    `;

    const binds = {
      controlId: { type: 'STRING', dir: 'BIND_OUT' },
      pasajero,
      vuelo,
      empleado: req.user.id,
      estado,
      notas
    };

    await executeProcedure(procedure, binds);
    
    res.status(201).json({
      success: true,
      message: 'Control registrado exitosamente',
      controlId: binds.controlId.value
    });
  } catch (error) {
    console.error('Error al registrar control:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
