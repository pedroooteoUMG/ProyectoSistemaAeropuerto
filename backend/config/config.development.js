module.exports = {
  errorReporting: {
    enabled: false,
    sentry: {
      dsn: process.env.SENTRY_DSN || ''
    }
  },
  server: {
    port: process.env.PORT || 3000,
    environment: 'development',
    logLevel: 'debug'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 1521,
    service: process.env.DB_SERVICE || 'orcl',
    user: process.env.DB_USER || 'system',
    password: process.env.DB_PASSWORD || 'oracle',
    maxPoolSize: 10,
    minPoolSize: 2,
    poolTimeout: 30000
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 15 * 60 * 1000,
      max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100
    },
    allowedOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3001'],  // Frontend URL
    methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax'
    }
  }
};
