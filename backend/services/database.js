const oracledb = require('oracledb');
const dbConfig = require('../config/database');

// Clase para manejar la conexión a la base de datos
class Database {
  constructor() {
    this.pool = null;
    this.replicaPool = null;
  }

  async initialize() {
    try {
      // Inicializar pool principal
      this.pool = await oracledb.createPool(dbConfig.dbConfig);
      
      // Inicializar pool réplica si está configurado
      if (dbConfig.replicaConfig.connectString) {
        this.replicaPool = await oracledb.createPool(dbConfig.replicaConfig);
      }
      
      console.log('Conexión a la base de datos establecida');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      throw error;
    }
  }

  async getConnection() {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('Error al obtener conexión:', error);
      throw error;
    }
  }

  async getReplicaConnection() {
    if (!this.replicaPool) {
      throw new Error('No se ha configurado una base de datos réplica');
    }
    try {
      return await this.replicaPool.getConnection();
    } catch (error) {
      console.error('Error al obtener conexión a réplica:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.close();
      }
      if (this.replicaPool) {
        await this.replicaPool.close();
      }
      console.log('Conexiones a la base de datos cerradas');
    } catch (error) {
      console.error('Error al cerrar conexiones:', error);
      throw error;
    }
  }
}

// Crear una instancia única del servicio de base de datos
const database = new Database();

// Función para ejecutar consultas
async function executeQuery(sql, binds = [], useReplica = true) {
  try {
    const connection = useReplica ? await database.getReplicaConnection() : await database.getConnection();
    const result = await connection.execute(sql, binds);
    await connection.close();
    return result;
  } catch (error) {
    console.error('Error al ejecutar consulta:', error);
    throw error;
  }
}

// Función para ejecutar procedimientos
async function executeProcedure(procedure, binds = {}) {
  try {
    const connection = await database.getConnection();
    const result = await connection.execute(procedure, binds, {
      autoCommit: true
    });
    await connection.close();
    return result;
  } catch (error) {
    console.error('Error al ejecutar procedimiento:', error);
    throw error;
  }
}

// Exportar las funciones
module.exports = {
  ...database,
  executeQuery,
  executeProcedure
};
