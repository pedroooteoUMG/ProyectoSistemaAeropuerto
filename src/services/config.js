export const dbConfig = {
  production: {
    user: process.env.DB_USER || 'aeropuerto',
    password: process.env.DB_PASSWORD || 'aeropuerto',
    connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl',
    pool: {
      min: 1,
      max: 5,
      increment: 1,
      timeout: 60,
      homogeneous: true
    }
  },
  replica: {
    user: process.env.DB_REPLICA_USER || 'aeropuerto_replica',
    password: process.env.DB_REPLICA_PASSWORD || 'aeropuerto_replica',
    connectString: process.env.DB_REPLICA_CONNECT_STRING || 'localhost:1521/orcl_replica',
    pool: {
      min: 1,
      max: 5,
      increment: 1,
      timeout: 60,
      homogeneous: true
    }
  }
};

// Función para obtener la configuración de la base de datos
export const getDbConfig = (isReplica = false) => {
  return isReplica ? dbConfig.replica : dbConfig.production;
};
