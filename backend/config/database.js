const oracledb = require('oracledb');
const config = require('./index');

// Configuración de conexión a la base de datos
const dbConfig = {
  user: config.database.production.user,
  password: config.database.production.password,
  connectString: config.database.production.connectString,
  pool: {
    min: 2,
    max: 10,
    increment: 1,
    timeout: 30000
  }
};

// Configuración de conexión a la base de datos réplica
const replicaConfig = {
  user: config.database.replica.user,
  password: config.database.replica.password,
  connectString: config.database.replica.connectString,
  pool: {
    min: 2,
    max: 10,
    increment: 1,
    timeout: 30000
  }
};

// Inicializar oracledb
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

module.exports = {
  dbConfig,
  replicaConfig
};
