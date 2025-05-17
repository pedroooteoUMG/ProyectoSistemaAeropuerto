const { celebrate, Joi } = require('celebrate');

// Esquemas de validación
const schemas = {
  // Validación para vuelos
  flight: {
    create: Joi.object({
      aeropuerto_origen: Joi.string().required(),
      aeropuerto_destino: Joi.string().required(),
      fecha: Joi.date().required(),
      hora_salida: Joi.string().regex(/^\d{2}:\d{2}$/).required(),
      hora_llegada: Joi.string().regex(/^\d{2}:\d{2}$/).required(),
      aerolinea: Joi.string().required()
    }),
    update: Joi.object({
      aeropuerto_origen: Joi.string(),
      aeropuerto_destino: Joi.string(),
      fecha: Joi.date(),
      hora_salida: Joi.string().regex(/^\d{2}:\d{2}$/),
      hora_llegada: Joi.string().regex(/^\d{2}:\d{2}$/),
      aerolinea: Joi.string()
    })
  },

  // Validación para reservaciones
  booking: {
    create: Joi.object({
      pasajero: Joi.string().required(),
      vuelo: Joi.string().required(),
      fecha_reserva: Joi.date().required(),
      precio_total: Joi.number().required()
    }),
    update: Joi.object({
      pasajero: Joi.string(),
      vuelo: Joi.string(),
      fecha_reserva: Joi.date(),
      precio_total: Joi.number()
    })
  },

  // Validación para incidentes de seguridad
  security: {
    create: Joi.object({
      pasajero: Joi.string(),
      employee: Joi.string().required(),
      description: Joi.string().required(),
      location: Joi.string().required(),
      severity: Joi.string().valid('low', 'medium', 'high').required()
    }),
    update: Joi.object({
      pasajero: Joi.string(),
      employee: Joi.string(),
      description: Joi.string(),
      location: Joi.string(),
      severity: Joi.string().valid('low', 'medium', 'high')
    })
  },

  // Validación para reportes
  report: {
    flights: Joi.object({
      date: Joi.date().required()
    }),
    bookings: Joi.object({
      flightId: Joi.string().required()
    }),
    security: Joi.object({
      startDate: Joi.date(),
      endDate: Joi.date()
    }),
    lostItems: Joi.object({
      date: Joi.date()
    })
  }
};

// Función para crear validadores
const createValidator = (schemaName, action) => {
  return celebrate({
    body: schemas[schemaName][action]
  });
};

// Validadores específicos
const flightValidator = {
  create: createValidator('flight', 'create'),
  update: createValidator('flight', 'update')
};

const bookingValidator = {
  create: createValidator('booking', 'create'),
  update: createValidator('booking', 'update')
};

const securityValidator = {
  create: createValidator('security', 'create'),
  update: createValidator('security', 'update')
};

const reportValidator = {
  flights: createValidator('report', 'flights'),
  bookings: createValidator('report', 'bookings'),
  security: createValidator('report', 'security'),
  lostItems: createValidator('report', 'lostItems')
};

module.exports = {
  flightValidator,
  bookingValidator,
  securityValidator,
  reportValidator
};
