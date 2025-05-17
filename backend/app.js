require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const config = require('./config/config.development');
const securityMiddleware = require('./middleware/security');
const errorReporting = require('./services/errorReporting');
const monitoring = require('./services/monitoring');

const app = express();

// Configuración de bodyParser (antes de todo)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
}));
app.use(securityMiddleware.hsts);
app.use(securityMiddleware.frameProtection);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.noSniff);
app.use(securityMiddleware.referrerPolicy);

// Configuración de CORS más permisiva para desarrollo
const corsOptions = {
  origin: true, // Permite cualquier origen
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 3600,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar CORS a todas las rutas
app.use(cors(corsOptions));

// Configuración adicional para manejar preflight requests
app.options('*', cors(corsOptions));

// Configuración de sesión
app.use(session({
  secret: config.session.secret,
  resave: config.session.resave,
  saveUninitialized: config.session.saveUninitialized,
  cookie: config.session.cookie
}));

// Configuración de rate limiting
app.use(securityMiddleware.apiLimiter);
app.use('/auth', securityMiddleware.authLimiter);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Origen de la petición:', req.headers.origin);
  console.log('Método:', req.method);
  console.log('Headers:', req.headers);
  next();
});

// Rutas de autenticación (antes de las rutas generales)
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Servir archivos estáticos con tipos MIME correctos
app.get('*.css', (req, res, next) => {
  res.type('text/css');
  next();
});

app.get('*.js', (req, res, next) => {
  res.type('application/javascript');
  next();
});

// Manejar todas las rutas no API sirviendo el frontend
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
  } else {
    next();
  }
});

// Configuración de monitoreo
app.use(monitoring.monitoringMiddleware());

// Configuración de reporte de errores
app.use(errorReporting.transactionHandler());

// Ruta de prueba
app.get('/', (req, res) => {
  console.log('Accediendo a la ruta raíz');
  res.json({ message: 'API funcionando correctamente' });
});

// Ruta de prueba de estado
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: config.server.port
  });
});

// Rutas generales
app.use('/users', require('./routes/users'));
app.use('/flights', require('./routes/flights'));
app.use('/passengers', require('./routes/passengers'));
app.use('/bookings', require('./routes/bookings'));
app.use('/security', require('./routes/security'));

// Manejo de errores
app.use(errorReporting.errorHandler());
app.use(errorReporting.transactionFinisher());

const PORT = config.server.port;
// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Promesa rechazada no manejada:', error);
});

const startServer = async () => {
  try {
    const server = await new Promise((resolve, reject) => {
      const srv = app.listen(PORT, '0.0.0.0', () => resolve(srv))
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`El puerto ${PORT} ya está en uso. Por favor:
1. Cierra cualquier otra instancia del servidor
2. Espera unos segundos
3. Intenta nuevamente`);
          }
          reject(err);
        });
    });

    console.log(`Servidor escuchando en el puerto ${PORT}`);
    console.log('Rutas disponibles:');
    console.log('- GET /: Ruta de prueba');
    console.log('- GET /status: Estado del servidor');
    console.log('- GET /auth/test: Prueba de autenticación');
    console.log('- POST /auth/login: Inicio de sesión');

    return server;
  } catch (error) {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
