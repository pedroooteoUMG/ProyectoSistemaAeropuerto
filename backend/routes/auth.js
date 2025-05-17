const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const cors = require('cors');

// Configuración de CORS específica para auth
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Aplicar CORS a todas las rutas de auth
router.use(cors(corsOptions));

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router funcionando' });
});

// Ruta de login
router.post('/login', (req, res) => {
  console.log('Recibida petición de login:', req.body);
  authController.login(req, res);
});

// Ruta de registro
router.post('/register', (req, res) => {
  console.log('Recibida petición de registro:', req.body);
  authController.register(req, res);
});

// Ruta de logout
router.post('/logout', (req, res) => {
  console.log('Recibida petición de logout');
  authController.logout(req, res);
});

// Ruta de recuperación de contraseña
router.post('/forgot-password', (req, res) => {
  console.log('Recibida petición de recuperación de contraseña:', req.body);
  authController.forgotPassword(req, res);
});

module.exports = router;
