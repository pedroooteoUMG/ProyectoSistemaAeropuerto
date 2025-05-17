const { Booking } = require('../models/booking');
const { authService } = require('../services/auth');
const { monitoring } = require('../services/monitoring');
const { cache } = require('../services/cache');

// Controlador de Reservaciones
class BookingsController {
  // Obtener todas las reservaciones
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, flight, passenger, status } = req.query;
      const offset = (page - 1) * limit;

      const sql = `
        SELECT B.*, P.PAS_nombre, P.PAS_apellido,
               V.VUE_fecha, V.VUE_hora_salida, V.VUE_hora_llegada,
               A1.AEP_nombre origen, A2.AEP_nombre destino
        FROM AER_Reservacion B
        JOIN AER_Pasajero P ON B.PAS_pasajero = P.PAS_Pasajero
        JOIN AER_Vuelo V ON B.VUE_vuelo = V.VUE_Vuelo
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        WHERE (:flight IS NULL OR B.VUE_vuelo = :flight)
        AND (:passenger IS NULL OR B.PAS_pasajero = :passenger)
        AND (:status IS NULL OR B.RES_estado = :status)
        ORDER BY B.RES_fecha_reserva DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        flight,
        passenger,
        status,
        offset,
        limit
      };

      const result = await executeQuery(sql, binds);
      const bookings = result.rows.map(row => new Booking(row));

      res.json({
        success: true,
        data: bookings,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.meta.total
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al obtener reservaciones: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener reservaciones'
      });
    }
  }

  // Obtener reservación por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const booking = await Booking.getById(id);

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Reservación no encontrada'
        });
        return;
      }

      // Obtener detalles adicionales
      const passengerDetails = await booking.getPassengerDetails();
      const flightDetails = await booking.getFlightDetails();
      const paymentInfo = await booking.getPaymentInfo();

      res.json({
        success: true,
        data: {
          ...booking,
          passenger: passengerDetails,
          flight: flightDetails,
          payment: paymentInfo
        }
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al obtener reservación: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener reservación'
      });
    }
  }

  // Crear nueva reservación
  static async create(req, res) {
    try {
      const { user } = req;
      const bookingId = await Booking.create({
        ...req.body,
        createdBy: user.id
      });

      const booking = await Booking.getById(bookingId);
      res.status(201).json({
        success: true,
        data: booking
      });

      // Invalidar caché
      await cache.invalidateCache('bookings', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al crear reservación: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al crear reservación'
      });
    }
  }

  // Actualizar reservación
  static async update(req, res) {
    try {
      const { user } = req;
      const { id } = req.params;
      const booking = await Booking.getById(id);

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Reservación no encontrada'
        });
        return;
      }

      await booking.update({
        ...req.body,
        updatedBy: user.id
      });

      const updatedBooking = await Booking.getById(id);
      res.json({
        success: true,
        data: updatedBooking
      });

      // Invalidar caché
      await cache.invalidateCache('bookings', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al actualizar reservación: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al actualizar reservación'
      });
    }
  }

  // Cancelar reservación
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const { user } = req;

      const booking = await Booking.getById(id);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Reservación no encontrada'
        });
        return;
      }

      await booking.cancel(reason);
      res.json({
        success: true,
        message: 'Reservación cancelada exitosamente'
      });

      // Invalidar caché
      await cache.invalidateCache('bookings', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al cancelar reservación: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al cancelar reservación'
      });
    }
  }

  // Generar boleto
  static async generateTicket(req, res) {
    try {
      const { id } = req.params;
      const booking = await Booking.getById(id);

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Reservación no encontrada'
        });
        return;
      }

      const ticket = await booking.generateTicket();
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al generar boleto: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al generar boleto'
      });
    }
  }

  // Obtener reservaciones por pasajero
  static async getByPassenger(req, res) {
    try {
      const { passenger } = req.params;
      const sql = `
        SELECT B.*, P.PAS_nombre, P.PAS_apellido,
               V.VUE_fecha, V.VUE_hora_salida, V.VUE_hora_llegada,
               A1.AEP_nombre origen, A2.AEP_nombre destino
        FROM AER_Reservacion B
        JOIN AER_Pasajero P ON B.PAS_pasajero = P.PAS_Pasajero
        JOIN AER_Vuelo V ON B.VUE_vuelo = V.VUE_Vuelo
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        WHERE B.PAS_pasajero = :passenger
        ORDER BY B.RES_fecha_reserva DESC
      `;

      const result = await executeQuery(sql, [passenger]);
      const bookings = result.rows.map(row => new Booking(row));

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al obtener reservaciones por pasajero: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener reservaciones por pasajero'
      });
    }
  }

  // Obtener reservaciones por vuelo
  static async getByFlight(req, res) {
    try {
      const { flight } = req.params;
      const sql = `
        SELECT B.*, P.PAS_nombre, P.PAS_apellido,
               V.VUE_fecha, V.VUE_hora_salida, V.VUE_hora_llegada,
               A1.AEP_nombre origen, A2.AEP_nombre destino
        FROM AER_Reservacion B
        JOIN AER_Pasajero P ON B.PAS_pasajero = P.PAS_Pasajero
        JOIN AER_Vuelo V ON B.VUE_vuelo = V.VUE_Vuelo
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        WHERE B.VUE_vuelo = :flight
        ORDER BY B.RES_fecha_reserva DESC
      `;

      const result = await executeQuery(sql, [flight]);
      const bookings = result.rows.map(row => new Booking(row));

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al obtener reservaciones por vuelo: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener reservaciones por vuelo'
      });
    }
  }
}

module.exports = BookingsController;
