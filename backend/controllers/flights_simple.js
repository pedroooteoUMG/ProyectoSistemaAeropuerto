const flights = [];
const passengers = [];
let nextId = 3; // Iniciar desde 3 ya que tenemos 2 vuelos base

// Inicializar vuelos base
flights.push({
  id: 1,
  origen: 'Bogotá',
  destino: 'Medellín',
  aerolinea: 'Aerocivil',
  fecha: '2025-05-16',
  hora_salida: '08:00',
  hora_llegada: '09:30',
  reservaciones: []
});

flights.push({
  id: 2,
  origen: 'Medellín',
  destino: 'Cali',
  aerolinea: 'Aerocivil',
  fecha: '2025-05-16',
  hora_salida: '10:00',
  hora_llegada: '11:30',
  reservaciones: []
});

// Inicializar pasajeros base
passengers.push({
  id: 1,
  nombre: 'Juan Pérez',
  documento: '1234567890',
  email: 'juan@example.com'
});

passengers.push({
  id: 2,
  nombre: 'María García',
  documento: '0987654321',
  email: 'maria@example.com'
});

const flightsController = {
  // Obtener todos los vuelos
  getAll: (req, res) => {
    try {
      res.json({
        success: true,
        data: flights,
        page: 1,
        limit: 10,
        total: flights.length
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
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const flight = flights.find(f => f.id === parseInt(id));

      if (!flight) {
        return res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
      }

      res.json({
        success: true,
        data: flight
      });
    } catch (error) {
      console.error('Error al obtener vuelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener vuelo'
      });
    }
  },

  // Crear nuevo vuelo
  create: (req, res) => {
    try {
      const { origen, destino, aerolinea, fecha, hora_salida, hora_llegada } = req.body;

      const newFlight = {
        id: nextId++,
        origen,
        destino,
        aerolinea,
        fecha,
        hora_salida,
        hora_llegada,
        reservaciones: []
      };

      flights.push(newFlight);
      res.status(201).json({
        success: true,
        data: newFlight
      });
    } catch (error) {
      console.error('Error al crear vuelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear vuelo'
      });
    }
  },

  // Actualizar vuelo
  update: (req, res) => {
    try {
      const { id } = req.params;
      const { origen, destino, aerolinea, fecha, hora_salida, hora_llegada } = req.body;

      const flightIndex = flights.findIndex(f => f.id === parseInt(id));
      if (flightIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
      }

      flights[flightIndex] = {
        ...flights[flightIndex],
        origen,
        destino,
        aerolinea,
        fecha,
        hora_salida,
        hora_llegada
      };

      res.json({
        success: true,
        data: flights[flightIndex]
      });
    } catch (error) {
      console.error('Error al actualizar vuelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar vuelo'
      });
    }
  },

  // Eliminar vuelo
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const flightIndex = flights.findIndex(f => f.id === parseInt(id));

      if (flightIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
      }

      flights.splice(flightIndex, 1);
      res.json({
        success: true,
        message: 'Vuelo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar vuelo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar vuelo'
      });
    }
  },

  // Reservar pasaje
  book: (req, res) => {
    try {
      const { vueloId, pasajeroId, asiento } = req.body;
      const flight = flights.find(f => f.id === parseInt(vueloId));
      const passenger = passengers.find(p => p.id === parseInt(pasajeroId));

      if (!flight) {
        return res.status(404).json({
          success: false,
          message: 'Vuelo no encontrado'
        });
      }

      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: 'Pasajero no encontrado'
        });
      }

      // Verificar si el asiento ya está ocupado
      const existingReservation = flight.reservaciones.find(r => r.asiento === asiento);
      if (existingReservation) {
        return res.status(400).json({
          success: false,
          message: 'Asiento ya ocupado'
        });
      }

      // Crear nueva reserva
      const newReservation = {
        id: Date.now(),
        vueloId: parseInt(vueloId),
        pasajeroId: parseInt(pasajeroId),
        asiento,
        fecha: new Date().toISOString()
      };

      flight.reservaciones.push(newReservation);

      res.json({
        success: true,
        data: newReservation
      });
    } catch (error) {
      console.error('Error al reservar pasaje:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reservar pasaje'
      });
    }
  }
};

module.exports = flightsController;
