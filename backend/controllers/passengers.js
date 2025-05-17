const passengersController = {
  // Obtener todos los pasajeros
  getAll: async (req, res) => {
    try {
      // Simular datos de pasajeros
      const passengers = [
        {
          id: 1,
          nombre: 'Juan Pérez',
          documento: '1234567890',
          email: 'juan@example.com'
        },
        {
          id: 2,
          nombre: 'María García',
          documento: '0987654321',
          email: 'maria@example.com'
        }
      ];

      res.json({
        success: true,
        data: passengers
      });
    } catch (error) {
      console.error('Error al obtener pasajeros:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pasajeros'
      });
    }
  }
};

module.exports = passengersController;
