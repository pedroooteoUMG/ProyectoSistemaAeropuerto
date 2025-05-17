const express = require('express');
const router = express.Router();
const flightsController = require('../controllers/flights_simple');
const authenticate = require('../middleware/auth_temp');
const { checkRole, ROLES } = require('../middleware/roles');

// Obtener todos los vuelos (permite a todos)
router.get('/', authenticate, flightsController.getAll);

// Obtener vuelo por ID (permite a todos)
router.get('/:id', authenticate, flightsController.getById);

// Crear nuevo vuelo (solo admin)
router.post('/', [authenticate, checkRole(ROLES.ADMIN)], flightsController.create);

// Actualizar vuelo (solo admin)
router.put('/:id', [authenticate, checkRole(ROLES.ADMIN)], flightsController.update);

// Eliminar vuelo (solo admin)
router.delete('/:id', [authenticate, checkRole(ROLES.ADMIN)], flightsController.delete);

// Reservar pasaje (permite a todos)
router.post('/:id/reservar', authenticate, flightsController.book);

module.exports = router;
