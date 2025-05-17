import oracledb from 'oracledb';
import { getDbConfig } from './config';

// Inicializar el pool de conexiones
let pool = null;

export const initializePool = async (isReplica = false) => {
  try {
    const config = getDbConfig(isReplica);
    pool = await oracledb.createPool(config);
    console.log(`Pool de conexiones ${isReplica ? 'replica' : 'productiva'} inicializado`);
    return pool;
  } catch (error) {
    console.error('Error al inicializar el pool:', error);
    throw error;
  }
};

export const executeQuery = async (sql, binds = [], options = {}, isReplica = false) => {
  try {
    if (!pool) {
      await initializePool(isReplica);
    }

    const connection = await pool.getConnection();
    
    try {
      const result = await connection.execute(sql, binds, options);
      return result;
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('Error al ejecutar consulta:', error);
    throw error;
  }
};

export const executeProcedure = async (procedure, binds = {}, options = {}, isReplica = false) => {
  try {
    if (!pool) {
      await initializePool(isReplica);
    }

    const connection = await pool.getConnection();
    
    try {
      const result = await connection.execute(procedure, binds, options);
      return result;
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('Error al ejecutar procedimiento:', error);
    throw error;
  }
};

// Ejemplo de procedimientos específicos
export const getFlights = async (date, isReplica = false) => {
  const sql = `
    SELECT * FROM AER_Vuelo
    WHERE VUE_fecha = :date
  `;
  return executeQuery(sql, [date], {}, isReplica);
};

export const getFlightById = async (flightId, isReplica = false) => {
  const sql = `
    SELECT * FROM AER_Vuelo
    WHERE VUE_Vuelo = :flightId
  `;
  return executeQuery(sql, [flightId], {}, isReplica);
};

export const createFlight = async (flightData) => {
  const procedure = `
    BEGIN
      AER_Vuelo_Package.create_flight(
        :vueloId,
        :aeropuertoOrigen,
        :aeropuertoDestino,
        :fechaHoraSalida,
        :fechaHoraLlegada,
        :aerolinea
      );
    END;
  `;
  return executeProcedure(procedure, flightData);
};

// Asegurarse de cerrar el pool cuando la aplicación se detenga
process.on('SIGINT', () => {
  if (pool) {
    pool.close()
      .then(() => {
        console.log('Pool cerrado');
        process.exit(0);
      })
      .catch(error => {
        console.error('Error al cerrar pool:', error);
        process.exit(1);
      });
  }
});
