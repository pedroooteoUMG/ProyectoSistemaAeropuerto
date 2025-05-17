const express = require('express');
const router = express.Router();
const { executeQuery, executeProcedure } = require('../services/database');
const { authenticate, canAccessReports } = require('../middleware/auth');
const { logger } = require('../middleware/logging');
const pdf = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Obtener reporte de vuelos por día
router.get('/flights/day', authenticate, canAccessReports, async (req, res) => {
  try {
    const { date } = req.query;
    const sql = `
      SELECT V.*, A1.AEP_nombre origen, A2.AEP_nombre destino, L.AER_nombre aerolinea
      FROM AER_Vuelo V
      JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
      JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
      JOIN AER_Aerolinea L ON V.VUE_aerolinea = L.AER_Aerolinea
      WHERE VUE_fecha = :date
      ORDER BY VUE_hora_salida
    `;
    
    const result = await executeQuery(sql, [date]);
    
    // Generar PDF
    const doc = new pdf();
    const filename = `reporte_vuelos_${date}.pdf`;
    const filepath = path.join(process.env.REPORTS_PATH, filename);
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // Generar contenido del PDF
    doc.fontSize(20).text('Reporte de Vuelos', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${date}`, { align: 'center' });
    doc.moveDown();
    
    // Tabla de vuelos
    doc.fontSize(10);
    result.rows.forEach((flight) => {
      doc.text(`Vuelo: ${flight.VUE_Vuelo}`);
      doc.text(`Origen: ${flight.origen}`);
      doc.text(`Destino: ${flight.destino}`);
      doc.text(`Aerolínea: ${flight.aerolinea}`);
      doc.text(`Hora Salida: ${flight.VUE_hora_salida}`);
      doc.text(`Hora Llegada: ${flight.VUE_hora_llegada}`);
      doc.moveDown();
    });
    
    doc.end();
    
    logger.info('Reporte generado', {
      type: 'flights_day',
      date,
      user: req.user.id
    });
    
    res.download(filepath, filename);
  } catch (error) {
    logger.error('Error al generar reporte', {
      type: 'flights_day',
      error: error.message,
      user: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte'
    });
  }
});

// Obtener reporte de reservaciones por vuelo
router.get('/bookings/flight/:flightId', authenticate, canAccessReports, async (req, res) => {
  try {
    const { flightId } = req.params;
    const sql = `
      SELECT R.*, P.PAS_nombre, P.PAS_apellido
      FROM AER_Reservacion R
      JOIN AER_Pasajero P ON R.PAS_pasajero = P.PAS_Pasajero
      WHERE R.VUE_vuelo = :flightId
      ORDER BY R.RES_fecha_reserva
    `;
    
    const result = await executeQuery(sql, [flightId]);
    
    // Generar PDF
    const doc = new pdf();
    const filename = `reporte_reservas_vuelo_${flightId}.pdf`;
    const filepath = path.join(process.env.REPORTS_PATH, filename);
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // Generar contenido del PDF
    doc.fontSize(20).text('Reporte de Reservaciones', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Vuelo: ${flightId}`, { align: 'center' });
    doc.moveDown();
    
    // Tabla de reservaciones
    doc.fontSize(10);
    result.rows.forEach((booking) => {
      doc.text(`Reservación: ${booking.RES_Reservacion}`);
      doc.text(`Pasajero: ${booking.PAS_nombre} ${booking.PAS_apellido}`);
      doc.text(`Fecha: ${booking.RES_fecha_reserva}`);
      doc.text(`Estado: ${booking.RES_estado}`);
      doc.text(`Precio: $${booking.RES_precio_total}`);
      doc.moveDown();
    });
    
    doc.end();
    
    logger.info('Reporte generado', {
      type: 'bookings_flight',
      flightId,
      user: req.user.id
    });
    
    res.download(filepath, filename);
  } catch (error) {
    logger.error('Error al generar reporte', {
      type: 'bookings_flight',
      error: error.message,
      user: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte'
    });
  }
});

// Obtener reporte de incidentes de seguridad
router.get('/security/incidents', authenticate, canAccessReports, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sql = `
      SELECT I.*, P.PAS_nombre, P.PAS_apellido, E.EMP_nombre
      FROM AER_Incidente I
      LEFT JOIN AER_Pasajero P ON I.PAS_pasajero = P.PAS_Pasajero
      LEFT JOIN AER_Empleado E ON I.EMP_Empleado = E.EMP_Empleado
      WHERE (:startDate IS NULL OR I.INS_fecha >= :startDate)
      AND (:endDate IS NULL OR I.INS_fecha <= :endDate)
      ORDER BY I.INS_fecha DESC
    `;
    
    const result = await executeQuery(sql, [startDate, endDate]);
    
    // Generar PDF
    const doc = new pdf();
    const filename = `reporte_incidentes_${startDate}_${endDate}.pdf`;
    const filepath = path.join(process.env.REPORTS_PATH, filename);
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // Generar contenido del PDF
    doc.fontSize(20).text('Reporte de Incidentes de Seguridad', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Período: ${startDate} - ${endDate}`, { align: 'center' });
    doc.moveDown();
    
    // Tabla de incidentes
    doc.fontSize(10);
    result.rows.forEach((incident) => {
      doc.text(`Incidente: ${incident.INS_Incidente}`);
      doc.text(`Fecha: ${incident.INS_fecha}`);
      doc.text(`Pasajero: ${incident.PAS_nombre} ${incident.PAS_apellido}`);
      doc.text(`Empleado: ${incident.EMP_nombre}`);
      doc.text(`Descripción: ${incident.INS_descripcion}`);
      doc.text(`Estado: ${incident.INS_estado}`);
      doc.moveDown();
    });
    
    doc.end();
    
    logger.info('Reporte generado', {
      type: 'security_incidents',
      startDate,
      endDate,
      user: req.user.id
    });
    
    res.download(filepath, filename);
  } catch (error) {
    logger.error('Error al generar reporte', {
      type: 'security_incidents',
      error: error.message,
      user: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte'
    });
  }
});

// Obtener reporte de objetos perdidos
router.get('/lost-items', authenticate, canAccessReports, async (req, res) => {
  try {
    const { date } = req.query;
    const sql = `
      SELECT O.*, P.PAS_nombre, P.PAS_apellido, E.EMP_nombre
      FROM AER_Objeto_Perdido O
      LEFT JOIN AER_Pasajero P ON O.PAS_pasajero = P.PAS_Pasajero
      LEFT JOIN AER_Empleado E ON O.EMP_Empleado = E.EMP_Empleado
      WHERE (:date IS NULL OR O.OBJ_fecha = :date)
      ORDER BY O.OBJ_fecha DESC
    `;
    
    const result = await executeQuery(sql, [date]);
    
    // Generar PDF
    const doc = new pdf();
    const filename = `reporte_objetos_perdidos_${date}.pdf`;
    const filepath = path.join(process.env.REPORTS_PATH, filename);
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // Generar contenido del PDF
    doc.fontSize(20).text('Reporte de Objetos Perdidos', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${date}`, { align: 'center' });
    doc.moveDown();
    
    // Tabla de objetos perdidos
    doc.fontSize(10);
    result.rows.forEach((item) => {
      doc.text(`Objeto: ${item.OBJ_Objeto_Perdido}`);
      doc.text(`Descripción: ${item.OBJ_descripcion}`);
      doc.text(`Fecha: ${item.OBJ_fecha}`);
      doc.text(`Pasajero: ${item.PAS_nombre} ${item.PAS_apellido}`);
      doc.text(`Estado: ${item.OBJ_estado}`);
      doc.moveDown();
    });
    
    doc.end();
    
    logger.info('Reporte generado', {
      type: 'lost_items',
      date,
      user: req.user.id
    });
    
    res.download(filepath, filename);
  } catch (error) {
    logger.error('Error al generar reporte', {
      type: 'lost_items',
      error: error.message,
      user: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte'
    });
  }
});

module.exports = router;
