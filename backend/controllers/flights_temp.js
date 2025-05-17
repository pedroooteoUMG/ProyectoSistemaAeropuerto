const { Flight } = require('../models/flight');

// Controlador de Vuelos
const flightsController = {
  // Obtener todos los vuelos
  getAll: async (req, res) => {
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
      console.error('Error al obtener vuelos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelos'
      });
    }
  },

  // Obtener vuelo por ID
  getById: async (req, res) => {
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
      console.error('Error al obtener vuelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelo'
      });
    }
  }
};

module.exports = flightsController;
