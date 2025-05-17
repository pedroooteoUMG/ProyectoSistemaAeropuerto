const { executeQuery, executeProcedure } = require('../services/database');
const { monitoring } = require('../services/monitoring');

// Modelo de Auditoría
class Audit {
  // Crear nuevo registro de auditoría
  static async create(data) {
    try {
      const sql = `
        INSERT INTO AER_Auditoria (
          AUD_usuario,
          AUD_ip,
          AUD_metodo,
          AUD_url,
          AUD_body,
          AUD_query,
          AUD_fecha,
          AUD_tipo,
          AUD_estado,
          AUD_duracion
        ) VALUES (
          :userId,
          :ip,
          :method,
          :url,
          :body,
          :query,
          SYSDATE,
          :type,
          :status,
          :duration
        )
        RETURNING AUD_Auditoria INTO :auditId
      `;

      const binds = {
        userId: data.userId,
        ip: data.ip,
        method: data.method,
        url: data.url,
        body: JSON.stringify(data.body),
        query: JSON.stringify(data.query),
        type: data.type,
        status: data.status,
        duration: data.duration,
        auditId: { type: oracledb.STRING, dir: oracledb.BIND_OUT }
      };

      const result = await executeQuery(sql, binds);
      return result.outBinds.auditId[0];
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al crear registro de auditoría: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener registros de auditoría
  static async getAll(filters = {}) {
    try {
      const sql = `
        SELECT A.*, U.EMP_nombre usuario,
               TO_CHAR(A.AUD_fecha, 'DD/MM/YYYY HH24:MI:SS') fecha
        FROM AER_Auditoria A
        LEFT JOIN AER_Empleado U ON A.AUD_usuario = U.EMP_Empleado
        WHERE (:userId IS NULL OR A.AUD_usuario = :userId)
        AND (:ip IS NULL OR A.AUD_ip = :ip)
        AND (:method IS NULL OR A.AUD_metodo = :method)
        AND (:url IS NULL OR A.AUD_url LIKE '%' || :url || '%')
        AND (:type IS NULL OR A.AUD_tipo = :type)
        AND (:status IS NULL OR A.AUD_estado = :status)
        AND (:startDate IS NULL OR A.AUD_fecha >= :startDate)
        AND (:endDate IS NULL OR A.AUD_fecha <= :endDate)
        ORDER BY A.AUD_fecha DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        userId: filters.userId,
        ip: filters.ip,
        method: filters.method,
        url: filters.url,
        type: filters.type,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit
      };

      const result = await executeQuery(sql, binds);
      return result.rows;
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener registros de auditoría: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener estadísticas de auditoría
  static async getStats(filters = {}) {
    try {
      const sql = `
        SELECT 
          COUNT(*) total,
          COUNT(DISTINCT AUD_usuario) usuarios,
          COUNT(DISTINCT AUD_tipo) tipos,
          COUNT(DISTINCT AUD_estado) estados,
          AVG(AUD_duracion) promedio_duracion,
          MAX(AUD_duracion) max_duracion,
          MIN(AUD_duracion) min_duracion
        FROM AER_Auditoria
        WHERE (:startDate IS NULL OR AUD_fecha >= :startDate)
        AND (:endDate IS NULL OR AUD_fecha <= :endDate)
      `;

      const binds = {
        startDate: filters.startDate,
        endDate: filters.endDate
      };

      const result = await executeQuery(sql, binds);
      return result.rows[0];
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener estadísticas: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener registros por usuario
  static async getByUser(userId, filters = {}) {
    try {
      const sql = `
        SELECT A.*, U.EMP_nombre usuario,
               TO_CHAR(A.AUD_fecha, 'DD/MM/YYYY HH24:MI:SS') fecha
        FROM AER_Auditoria A
        LEFT JOIN AER_Empleado U ON A.AUD_usuario = U.EMP_Empleado
        WHERE A.AUD_usuario = :userId
        AND (:method IS NULL OR A.AUD_metodo = :method)
        AND (:url IS NULL OR A.AUD_url LIKE '%' || :url || '%')
        AND (:type IS NULL OR A.AUD_tipo = :type)
        AND (:status IS NULL OR A.AUD_estado = :status)
        AND (:startDate IS NULL OR A.AUD_fecha >= :startDate)
        AND (:endDate IS NULL OR A.AUD_fecha <= :endDate)
        ORDER BY A.AUD_fecha DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        userId,
        method: filters.method,
        url: filters.url,
        type: filters.type,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit
      };

      const result = await executeQuery(sql, binds);
      return result.rows;
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener registros por usuario: ${error.message}`
      );
      throw error;
    }
  }

  // Generar reporte de auditoría
  static async generateReport(filters = {}) {
    try {
      const sql = `
        SELECT 
          TO_CHAR(AUD_fecha, 'DD/MM/YYYY') fecha,
          AUD_usuario,
          AUD_metodo metodo,
          AUD_url url,
          AUD_tipo tipo,
          AUD_estado estado,
          COUNT(*) cantidad,
          AVG(AUD_duracion) promedio_duracion
        FROM AER_Auditoria
        WHERE (:startDate IS NULL OR AUD_fecha >= :startDate)
        AND (:endDate IS NULL OR AUD_fecha <= :endDate)
        GROUP BY 
          TO_CHAR(AUD_fecha, 'DD/MM/YYYY'),
          AUD_usuario,
          AUD_metodo,
          AUD_url,
          AUD_tipo,
          AUD_estado
        ORDER BY fecha DESC, cantidad DESC
      `;

      const binds = {
        startDate: filters.startDate,
        endDate: filters.endDate
      };

      const result = await executeQuery(sql, binds);
      return result.rows;
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al generar reporte: ${error.message}`
      );
      throw error;
    }
  }

  // Limpiar registros antiguos
  static async cleanup(olderThanDays = 30) {
    try {
      const sql = `
        DELETE FROM AER_Auditoria
        WHERE AUD_fecha < SYSDATE - :days
      `;

      const binds = {
        days: olderThanDays
      };

      const result = await executeQuery(sql, binds);
      return result.rowsAffected;
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al limpiar registros: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener registros por tipo
  static async getByType(type, filters = {}) {
    try {
      const sql = `
        SELECT A.*, U.EMP_nombre usuario,
               TO_CHAR(A.AUD_fecha, 'DD/MM/YYYY HH24:MI:SS') fecha
        FROM AER_Auditoria A
        LEFT JOIN AER_Empleado U ON A.AUD_usuario = U.EMP_Empleado
        WHERE A.AUD_tipo = :type
        AND (:userId IS NULL OR A.AUD_usuario = :userId)
        AND (:method IS NULL OR A.AUD_metodo = :method)
        AND (:url IS NULL OR A.AUD_url LIKE '%' || :url || '%')
        AND (:status IS NULL OR A.AUD_estado = :status)
        AND (:startDate IS NULL OR A.AUD_fecha >= :startDate)
        AND (:endDate IS NULL OR A.AUD_fecha <= :endDate)
        ORDER BY A.AUD_fecha DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        type,
        userId: filters.userId,
        method: filters.method,
        url: filters.url,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit
      };

      const result = await executeQuery(sql, binds);
      return result.rows;
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener registros por tipo: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener errores específicos
  static async getErrors(filters = {}) {
    try {
      const sql = `
        SELECT A.*, U.EMP_nombre usuario,
               TO_CHAR(A.AUD_fecha, 'DD/MM/YYYY HH24:MI:SS') fecha
        FROM AER_Auditoria A
        LEFT JOIN AER_Empleado U ON A.AUD_usuario = U.EMP_Empleado
        WHERE A.AUD_estado >= 400
        AND (:userId IS NULL OR A.AUD_usuario = :userId)
        AND (:method IS NULL OR A.AUD_metodo = :method)
        AND (:url IS NULL OR A.AUD_url LIKE '%' || :url || '%')
        AND (:startDate IS NULL OR A.AUD_fecha >= :startDate)
        AND (:endDate IS NULL OR A.AUD_fecha <= :endDate)
        ORDER BY A.AUD_fecha DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        userId: filters.userId,
        method: filters.method,
        url: filters.url,
        startDate: filters.startDate,
        endDate: filters.endDate,
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit
      };

      const result = await executeQuery(sql, binds);
      return result.rows;
    } catch (error) {
      monitoring.createSystemAlert(
        'audit',
        1,
        0,
        `Error al obtener errores: ${error.message}`
      );
      throw error;
    }
  }
}

module.exports = Audit;
