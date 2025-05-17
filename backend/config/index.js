require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'debug'
  },
  errorReporting: {
    enabled: process.env.ERROR_REPORTING_ENABLED === 'true',
    service: process.env.ERROR_REPORTING_SERVICE || 'sentry',
    dsn: process.env.ERROR_REPORTING_DSN
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 15 * 60 * 1000,
      max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100
    },
    allowedOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  database: {
    production: {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    },
    replica: {
      user: process.env.DB_REPLICA_USER,
      password: process.env.DB_REPLICA_PASSWORD,
      connectString: process.env.DB_REPLICA_CONNECT_STRING
    }
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
  },
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER
  }
};

module.exports = config;
