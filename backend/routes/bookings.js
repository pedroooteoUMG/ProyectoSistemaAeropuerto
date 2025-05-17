const express = require('express');
const router = express.Router();
const { executeQuery, executeProcedure } = require('../services/database');
const { authenticate, authorize } = require('../middleware/auth');

// Obtener todas las reservaciones
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, flightId } = req.query;
    const sql = `
      SELECT RES_Reservacion, PAS_pasajero, VUE_vuelo,
             RES_fecha_reserva, RES_estado, RES_precio_total
      FROM AER_Reservacion
      WHERE (:date IS NULL OR RES_fecha_reserva = :date)
      AND (:flightId IS NULL OR VUE_vuelo = :flightId)
      ORDER BY RES_fecha_reserva DESC
    `;
    
    const result = await executeQuery(sql, [date, flightId]);
    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error('Error al obtener reservaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener una reservación específica
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT R.*, P.PAS_nombre, P.PAS_apellido, V.VUE_aerolinea
      FROM AER_Reservacion R
      JOIN AER_Pasajero P ON R.PAS_pasajero = P.PAS_Pasajero
      JOIN AER_Vuelo V ON R.VUE_vuelo = V.VUE_Vuelo
      WHERE R.RES_Reservacion = :id
    `;
    
    const result = await executeQuery(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservación no encontrada'
      });
    }

    res.json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener reservación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear una nueva reservación
router.post('/', authenticate, async (req, res) => {
  try {
    const { pasajero, vuelo, fecha_reserva, precio_total } = req.body;

    if (!req.user.role === 'admin' && !req.user.role === 'booking_manager') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear reservaciones'
      });
    }

    const procedure = `
      BEGIN
        AER_Reservacion_Package.create_booking(
          :bookingId,
          :pasajero,
          :vuelo,
          :fecha_reserva,
          :precio_total
        );
      END;
    `;

    const binds = {
      bookingId: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
      pasajero,
      vuelo,
      fecha_reserva,
      precio_total
    };

    await executeProcedure(procedure, binds);
    
    res.status(201).json({
      success: true,
      message: 'Reservación creada exitosamente',
      bookingId: binds.bookingId.value
    });
  } catch (error) {
    console.error('Error al crear reservación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar una reservación
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, precio_total } = req.body;

    const procedure = `
      BEGIN
        AER_Reservacion_Package.update_booking(
          :bookingId,
          :estado,
          :precio_total
        );
      END;
    `;

    const binds = {
      bookingId: id,
      estado,
      precio_total
    };

    await executeProcedure(procedure, binds);
    
    res.json({
      success: true,
      message: 'Reservación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar reservación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Cancelar reservación
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const procedure = `
      BEGIN
        AER_Reservacion_Package.cancel_booking(
          :bookingId
        );
      END;
    `;

    const binds = {
      bookingId: id
    };

    await executeProcedure(procedure, binds);
    
    res.json({
      success: true,
      message: 'Reservación cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar reservación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar boleto
router.post('/:id/ticket', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const procedure = `
      BEGIN
        AER_Reservacion_Package.generate_ticket(
          :bookingId,
          :ticketId
        );
      END;
    `;

    const binds = {
      bookingId: id,
      ticketId: { type: oracledb.STRING, dir: oracledb.BIND_OUT }
    };

    await executeProcedure(procedure, binds);
    
    res.json({
      success: true,
      message: 'Boleto generado exitosamente',
      ticketId: binds.ticketId.value
    });
  } catch (error) {
    console.error('Error al generar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener historial de reservaciones
router.get('/history', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sql = `
      SELECT R.*, P.PAS_nombre, P.PAS_apellido, V.VUE_aerolinea
      FROM AER_Reservacion R
      JOIN AER_Pasajero P ON R.PAS_pasajero = P.PAS_PASAJERO
      JOIN AER_Vuelo V ON R.VUE_vuelo = V.VUE_Vuelo
      WHERE (:startDate IS NULL OR RES_fecha_reserva >= :startDate)
      AND (:endDate IS NULL OR RES_fecha_reserva <= :endDate)
      ORDER BY RES_fecha_reserva DESC
    `;
    
    const result = await executeQuery(sql, [startDate, endDate]);
    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas
router.get('/stats', authenticate, async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_bookings,
        SUM(RES_precio_total) as total_revenue,
        AVG(RES_precio_total) as avg_price,
        MAX(RES_precio_total) as max_price,
        MIN(RES_precio_total) as min_price
      FROM AER_Reservacion
      WHERE RES_fecha_reserva >= TRUNC(SYSDATE) - 30
    `;
    
    const result = await executeQuery(sql);
    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
