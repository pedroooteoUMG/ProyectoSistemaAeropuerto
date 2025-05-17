const { Flight } = require('../models/flight');
const { authService } = require('../services/auth');
const { monitoring } = require('../services/monitoring');
const { cache } = require('../services/cache');

// Controlador de Vuelos
class FlightsController {
  // Obtener todos los vuelos
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, origin, destination, date } = req.query;
      const offset = (page - 1) * limit;

      const sql = `
        SELECT V.*, A1.AEP_nombre origen, A2.AEP_nombre destino,
               L.AER_nombre aerolinea
        FROM AER_Vuelo V
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        JOIN AER_Aerolinea L ON V.VUE_aerolinea = L.AER_Aerolinea
        WHERE (:origin IS NULL OR V.VUE_aeropuerto_origen = :origin)
        AND (:destination IS NULL OR V.VUE_aeropuerto_destino = :destination)
        AND (:date IS NULL OR V.VUE_fecha = :date)
        ORDER BY V.VUE_fecha, V.VUE_hora_salida
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        origin,
        destination,
        date,
        offset,
        limit
      };

      const result = await executeQuery(sql, binds);
      const flights = result.rows.map(row => new Flight(row));

      res.json({
        success: true,
        data: flights,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.meta.total
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'flights',
        1,
        0,
        `Error al obtener vuelos: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelos'
      });
    }
  }

  // Obtener vuelo por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const flight = await Flight.getById(id);

      if (!flight) {
        res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
        return;
      }

      // Obtener detalles adicionales
      const escalas = await flight.getEscalas();
      const reservaciones = await flight.getBookings();

      res.json({
        success: true,
        data: {
          ...flight,
          escalas,
          reservaciones
        }
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'flights',
        1,
        0,
        `Error al obtener vuelo: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelo'
      });
    }
  }

  // Crear nuevo vuelo
  static async create(req, res) {
    try {
      const { user } = req;
      const flightId = await Flight.create({
        ...req.body,
        createdBy: user.id
      });

      const flight = await Flight.getById(flightId);
      res.status(201).json({
        success: true,
        data: flight
      });

      // Invalidar caché
      await cache.invalidateCache('flights', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'flights',
        1,
        0,
        `Error al crear vuelo: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al crear vuelo'
      });
    }
  }

  // Actualizar vuelo
  static async update(req, res) {
    try {
      const { user } = req;
      const { id } = req.params;
      const flight = await Flight.getById(id);

      if (!flight) {
        res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
        return;
      }

      await flight.update({
        ...req.body,
        updatedBy: user.id
      });

      const updatedFlight = await Flight.getById(id);
      res.json({
        success: true,
        data: updatedFlight
      });

      // Invalidar caché
      await cache.invalidateCache('flights', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'flights',
        1,
        0,
        `Error al actualizar vuelo: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al actualizar vuelo'
      });
    }
  }

  // Eliminar vuelo
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await Flight.delete(id);
      res.json({
        success: true,
        message: 'Vuelo eliminado exitosamente'
      });

      // Invalidar caché
      await cache.invalidateCache('flights', {});
    } catch (error) {
      monitoring.createSystemAlert(
        'flights',
        1,
        0,
        `Error al eliminar vuelo: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al eliminar vuelo'
      });
    }
  }

  // Obtener vuelos por aerolínea
  static async getByAirline(req, res) {
    try {
      const { airline } = req.params;
      const sql = `
        SELECT V.*, A1.AEP_nombre origen, A2.AEP_nombre destino,
               L.AER_nombre aerolinea
        FROM AER_Vuelo V
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        JOIN AER_Aerolinea L ON V.VUE_aerolinea = L.AER_Aerolinea
        WHERE V.VUE_aerolinea = :airline
        ORDER BY V.VUE_fecha, V.VUE_hora_salida
      `;

      const result = await executeQuery(sql, [airline]);
      const flights = result.rows.map(row => new Flight(row));

      res.json({
        success: true,
        data: flights
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'flights',
        1,
        0,
        `Error al obtener vuelos por aerolínea: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelos por aerolínea'
      });
    }
  }

  // Obtener vuelos por fecha
  static async getByDate(req, res) {
    try {
      const { date } = req.params;
      const sql = `
        SELECT V.*, A1.AEP_nombre origen, A2.AEP_nombre destino,
               L.AER_nombre aerolinea
        FROM AER_Vuelo V
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        JOIN AER_Aerolinea L ON V.VUE_aerolinea = L.AER_Aerolinea
        WHERE V.VUE_fecha = :date
        ORDER BY V.VUE_hora_salida
      `;

      const result = await executeQuery(sql, [date]);
      const flights = result.rows.map(row => new Flight(row));

      res.json({
        success: true,
        data: flights
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'flights',
        1,
        0,
        `Error al obtener vuelos por fecha: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelos por fecha'
      });
    }
  }
}

module.exports = FlightsController;
