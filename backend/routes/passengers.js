const express = require('express');
const router = express.Router();
const passengersController = require('../controllers/passengers');
const authenticate = require('../middleware/auth_temp');

// Obtener todos los pasajeros
router.get('/', authenticate, passengersController.getAll);

module.exports = router;
