const path = require('path');

module.exports = {
  // Servidor
  server: {
    port: process.env.PORT || 3000,
    environment: 'production',
    logLevel: process.env.LOG_LEVEL || 'info',
    maxResponseTime: 30000,
    requestTimeout: 30000
  },

  // Base de datos
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 1521,
    service: process.env.DB_SERVICE || 'orcl',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    maxPoolSize: 20,
    minPoolSize: 5,
    poolTimeout: 30000
  },

  // Seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    passwordSaltRounds: parseInt(process.env.SECURITY_PASSWORD_SALT_ROUNDS) || 10,
    passwordMinLength: parseInt(process.env.SECURITY_PASSWORD_MIN_LENGTH) || 8,
    passwordMaxLength: parseInt(process.env.SECURITY_PASSWORD_MAX_LENGTH) || 100,
    passwordRequireSpecial: process.env.SECURITY_PASSWORD_REQUIRE_SPECIAL === 'true',
    passwordRequireNumber: process.env.SECURITY_PASSWORD_REQUIRE_NUMBER === 'true',
    passwordRequireUpper: process.env.SECURITY_PASSWORD_REQUIRE_UPPER === 'true',
    passwordRequireLower: process.env.SECURITY_PASSWORD_REQUIRE_LOWER === 'true',
    allowedOrigins: process.env.CORS_ORIGIN.split(',').map(o => o.trim()),
    methods: process.env.CORS_METHODS.split(',').map(m => m.trim())
  },

  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    maxSize: process.env.CACHE_MAX_SIZE || '100mb',
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
  },

  // Sesión
  session: {
    secret: process.env.SESSION_SECRET,
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 86400,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFileSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14
  },

  // Monitoreo
  monitoring: {
    newRelic: {
      enabled: true,
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: process.env.NEW_RELIC_APP_NAME
    }
  },

  // Error Reporting
  errorReporting: {
    enabled: process.env.ERROR_REPORTING_ENABLED === 'true',
    service: process.env.ERROR_REPORTING_SERVICE,
    dsn: process.env.ERROR_REPORTING_DSN
  },

  // Auditoría
  audit: {
    logRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 30,
    maxLogsPerDay: parseInt(process.env.AUDIT_MAX_LOGS_PER_DAY) || 1000
  },

  // Rutas
  paths: {
    public: path.join(__dirname, '../public'),
    views: path.join(__dirname, '../views'),
    uploads: path.join(__dirname, '../uploads')
  }
};
