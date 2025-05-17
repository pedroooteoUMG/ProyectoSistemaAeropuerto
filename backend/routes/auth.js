const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// Ruta de login
// Ruta de prueba para verificar que el router está funcionando
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router funcionando' });
});

// Ruta de login
router.post('/login', (req, res) => {
  console.log('Recibida petición de login:', req.body);
  authController.login(req, res);
});

module.exports = router;
