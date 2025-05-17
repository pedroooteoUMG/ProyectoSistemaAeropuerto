require('dotenv').config();

const config = {
  server: {
    port: process.env.API_PORT || 3001,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'debug'
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS) || 10,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
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
  reports: {
    path: process.env.REPORTS_PATH || './reports',
    format: process.env.REPORTS_FORMAT || 'pdf'
  }
};

module.exports = config;
