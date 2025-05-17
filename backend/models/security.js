const { executeQuery, executeProcedure } = require('../services/database');
const { authService } = require('../services/auth');

// Modelo de Incidente de Seguridad
class SecurityIncident {
  constructor(data) {
    this.id = data.INS_Incidente;
    this.type = data.INS_tipo;
    this.description = data.INS_descripcion;
    this.date = data.INS_fecha;
    this.time = data.INS_hora;
    this.location = data.INS_ubicacion;
    this.severity = data.INS_gravedad;
    this.status = data.INS_estado;
    this.passenger = data.PAS_pasajero;
    this.employee = data.EMP_Empleado;
    this.createdBy = data.INS_creado_por;
    this.createdAt = data.INS_fecha_creacion;
    this.updatedBy = data.INS_actualizado_por;
    this.updatedAt = data.INS_fecha_actualizacion;
  }

  // Validar datos del incidente
  static validate(data) {
    const requiredFields = ['type', 'description', 'location', 'severity', 'employee'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
    }

    // Validar tipo de incidente
    const validTypes = ['robo', 'agresion', 'sospechoso', 'incidente', 'emergencia'];
    if (!validTypes.includes(data.type.toLowerCase())) {
      throw new Error(`Tipo de incidente inválido. Opciones válidas: ${validTypes.join(', ')}`);
    }

    // Validar gravedad
    const validSeverity = ['bajo', 'medio', 'alto', 'critico'];
    if (!validSeverity.includes(data.severity.toLowerCase())) {
      throw new Error(`Gravedad inválida. Opciones válidas: ${validSeverity.join(', ')}`);
    }

    // Validar formato de hora
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(data.time)) {
      throw new Error('Formato de hora inválido. Debe ser HH:MM');
    }

    // Validar descripción
    if (data.description.length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
  }

  // Crear nuevo incidente
  static async create(data) {
    try {
      this.validate(data);

      const procedure = `
        BEGIN
          AER_Incidente_Package.create_incident(
            :incidentId,
            :type,
            :description,
            :date,
            :time,
            :location,
            :severity,
            :status,
            :passenger,
            :employee,
            :createdBy
          );
        END;
      `;

      const binds = {
        incidentId: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        type: data.type.toLowerCase(),
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        severity: data.severity.toLowerCase(),
        status: 'pendiente',
        passenger: data.passenger,
        employee: data.employee,
        createdBy: data.createdBy
      };

      const result = await executeProcedure(procedure, binds);
      return result.outBinds.incidentId;
    } catch (error) {
      throw new Error(`Error al crear incidente: ${error.message}`);
    }
  }

  // Obtener incidente por ID
  static async getById(id) {
    try {
      const sql = `
        SELECT I.*, P.PAS_nombre pasajeroNombre, P.PAS_apellido pasajeroApellido,
               E.EMP_nombre empleadoNombre, E.EMP_apellido empleadoApellido,
               T.TYP_descripcion tipoDescripcion
        FROM AER_Incidente I
        LEFT JOIN AER_Pasajero P ON I.PAS_pasajero = P.PAS_Pasajero
        LEFT JOIN AER_Empleado E ON I.EMP_Empleado = E.EMP_Empleado
        LEFT JOIN AER_Tipo_Incidente T ON I.TYP_tipo = T.TYP_Tipo
        WHERE I.INS_Incidente = :id
      `;

      const result = await executeQuery(sql, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      return new SecurityIncident(result.rows[0]);
    } catch (error) {
      throw new Error(`Error al obtener incidente: ${error.message}`);
    }
  }

  // Actualizar incidente
  async update(data) {
    try {
      const procedure = `
        BEGIN
          AER_Incidente_Package.update_incident(
            :incidentId,
            :type,
            :description,
            :location,
            :severity,
            :status,
            :passenger,
            :updatedBy
          );
        END;
      `;

      const binds = {
        incidentId: this.id,
        type: data.type?.toLowerCase() || this.type,
        description: data.description || this.description,
        location: data.location || this.location,
        severity: data.severity?.toLowerCase() || this.severity,
        status: data.status?.toLowerCase() || this.status,
        passenger: data.passenger || this.passenger,
        updatedBy: data.updatedBy
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar incidente: ${error.message}`);
    }
  }

  // Eliminar incidente
  static async delete(id) {
    try {
      const procedure = `
        BEGIN
          AER_Incidente_Package.delete_incident(:incidentId);
        END;
      `;

      await executeProcedure(procedure, { incidentId: id });
    } catch (error) {
      throw new Error(`Error al eliminar incidente: ${error.message}`);
    }
  }

  // Obtener historial de incidentes
  static async getHistory(startDate, endDate, type, severity) {
    try {
      const sql = `
        SELECT I.*, P.PAS_nombre pasajeroNombre, P.PAS_apellido pasajeroApellido,
               E.EMP_nombre empleadoNombre, E.EMP_apellido empleadoApellido,
               T.TYP_descripcion tipoDescripcion
        FROM AER_Incidente I
        LEFT JOIN AER_Pasajero P ON I.PAS_pasajero = P.PAS_Pasajero
        LEFT JOIN AER_Empleado E ON I.EMP_Empleado = E.EMP_Empleado
        LEFT JOIN AER_Tipo_Incidente T ON I.TYP_tipo = T.TYP_Tipo
        WHERE (:startDate IS NULL OR I.INS_fecha >= :startDate)
        AND (:endDate IS NULL OR I.INS_fecha <= :endDate)
        AND (:type IS NULL OR LOWER(I.INS_tipo) = LOWER(:type))
        AND (:severity IS NULL OR LOWER(I.INS_gravedad) = LOWER(:severity))
        ORDER BY I.INS_fecha DESC
      `;

      const result = await executeQuery(sql, [startDate, endDate, type, severity]);
      return result.rows.map(row => new SecurityIncident(row));
    } catch (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }

  // Obtener estadísticas
  static async getStatistics(startDate, endDate) {
    try {
      const sql = `
        SELECT
          COUNT(*) total_incidentes,
          COUNT(CASE WHEN INS_gravedad = 'alto' THEN 1 END) incidentes_alto,
          COUNT(CASE WHEN INS_gravedad = 'critico' THEN 1 END) incidentes_critico,
          COUNT(DISTINCT PAS_pasajero) pasajeros_afectados,
          COUNT(DISTINCT EMP_Empleado) empleados_involucrados
        FROM AER_Incidente
        WHERE (:startDate IS NULL OR INS_fecha >= :startDate)
        AND (:endDate IS NULL OR INS_fecha <= :endDate)
      `;

      const result = await executeQuery(sql, [startDate, endDate]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Obtener reportes
  static async getReports(startDate, endDate, type) {
    try {
      const sql = `
        SELECT R.*, I.INS_tipo, I.INS_gravedad,
               E.EMP_nombre, E.EMP_apellido
        FROM AER_Reporte_Seguridad R
        JOIN AER_Incidente I ON R.INS_incidente = I.INS_Incidente
        JOIN AER_Empleado E ON R.EMP_Empleado = E.EMP_Empleado
        WHERE (:startDate IS NULL OR R.REP_fecha >= :startDate)
        AND (:endDate IS NULL OR R.REP_fecha <= :endDate)
        AND (:type IS NULL OR LOWER(I.INS_tipo) = LOWER(:type))
        ORDER BY R.REP_fecha DESC
      `;

      const result = await executeQuery(sql, [startDate, endDate, type]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener reportes: ${error.message}`);
    }
  }

  // Generar alerta
  async generateAlert() {
    try {
      const procedure = `
        BEGIN
          AER_Incidente_Package.generate_alert(
            :incidentId,
            :alertId
          );
        END;
      `;

      const binds = {
        incidentId: this.id,
        alertId: { type: oracledb.STRING, dir: oracledb.BIND_OUT }
      };

      const result = await executeProcedure(procedure, binds);
      return result.outBinds.alertId;
    } catch (error) {
      throw new Error(`Error al generar alerta: ${error.message}`);
    }
  }

  // Asignar recursos
  async assignResources(resources) {
    try {
      const procedure = `
        BEGIN
          AER_Incidente_Package.assign_resources(
            :incidentId,
            :resources
          );
        END;
      `;

      const binds = {
        incidentId: this.id,
        resources: resources
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al asignar recursos: ${error.message}`);
    }
  }
}

// Modelo de Control de Seguridad
class SecurityControl {
  constructor(data) {
    this.id = data.CTR_Control;
    this.type = data.CTR_tipo;
    this.description = data.CTR_descripcion;
    this.location = data.CTR_ubicacion;
    this.status = data.CTR_estado;
    this.lastCheck = data.CTR_ultima_verificacion;
    this.nextCheck = data.CTR_proxima_verificacion;
    this.responsible = data.EMP_Empleado;
    this.createdBy = data.CTR_creado_por;
    this.createdAt = data.CTR_fecha_creacion;
    this.updatedBy = data.CTR_actualizado_por;
    this.updatedAt = data.CTR_fecha_actualizacion;
  }

  // Validar datos del control
  static validate(data) {
    const requiredFields = ['type', 'description', 'location', 'responsible'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
    }

    // Validar tipo de control
    const validTypes = ['cctv', 'alarma', 'detector', 'candado', 'barrera'];
    if (!validTypes.includes(data.type.toLowerCase())) {
      throw new Error(`Tipo de control inválido. Opciones válidas: ${validTypes.join(', ')}`);
    }

    // Validar descripción
    if (data.description.length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
  }

  // Crear nuevo control
  static async create(data) {
    try {
      this.validate(data);

      const procedure = `
        BEGIN
          AER_Control_Package.create_control(
            :controlId,
            :type,
            :description,
            :location,
            :status,
            :responsible,
            :createdBy
          );
        END;
      `;

      const binds = {
        controlId: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        type: data.type.toLowerCase(),
        description: data.description,
        location: data.location,
        status: 'activo',
        responsible: data.responsible,
        createdBy: data.createdBy
      };

      const result = await executeProcedure(procedure, binds);
      return result.outBinds.controlId;
    } catch (error) {
      throw new Error(`Error al crear control: ${error.message}`);
    }
  }

  // Obtener control por ID
  static async getById(id) {
    try {
      const sql = `
        SELECT C.*, E.EMP_nombre responsableNombre, E.EMP_apellido responsableApellido,
               T.TYP_descripcion tipoDescripcion
        FROM AER_Control C
        LEFT JOIN AER_Empleado E ON C.EMP_Empleado = E.EMP_Empleado
        LEFT JOIN AER_Tipo_Control T ON C.TYP_tipo = T.TYP_Tipo
        WHERE C.CTR_Control = :id
      `;

      const result = await executeQuery(sql, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      return new SecurityControl(result.rows[0]);
    } catch (error) {
      throw new Error(`Error al obtener control: ${error.message}`);
    }
  }

  // Actualizar control
  async update(data) {
    try {
      const procedure = `
        BEGIN
          AER_Control_Package.update_control(
            :controlId,
            :type,
            :description,
            :location,
            :status,
            :responsible,
            :updatedBy
          );
        END;
      `;

      const binds = {
        controlId: this.id,
        type: data.type?.toLowerCase() || this.type,
        description: data.description || this.description,
        location: data.location || this.location,
        status: data.status?.toLowerCase() || this.status,
        responsible: data.responsible || this.responsible,
        updatedBy: data.updatedBy
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar control: ${error.message}`);
    }
  }

  // Eliminar control
  static async delete(id) {
    try {
      const procedure = `
        BEGIN
          AER_Control_Package.delete_control(:controlId);
        END;
      `;

      await executeProcedure(procedure, { controlId: id });
    } catch (error) {
      throw new Error(`Error al eliminar control: ${error.message}`);
    }
  }

  // Obtener controles por tipo
  static async getByType(type) {
    try {
      const sql = `
        SELECT C.*, E.EMP_nombre responsableNombre, E.EMP_apellido responsableApellido,
               T.TYP_descripcion tipoDescripcion
        FROM AER_Control C
        LEFT JOIN AER_Empleado E ON C.EMP_Empleado = E.EMP_Empleado
        LEFT JOIN AER_Tipo_Control T ON C.TYP_tipo = T.TYP_Tipo
        WHERE LOWER(C.CTR_tipo) = LOWER(:type)
        ORDER BY C.CTR_ultima_verificacion DESC
      `;

      const result = await executeQuery(sql, [type]);
      return result.rows.map(row => new SecurityControl(row));
    } catch (error) {
      throw new Error(`Error al obtener controles: ${error.message}`);
    }
  }

  // Realizar verificación
  async check() {
    try {
      const procedure = `
        BEGIN
          AER_Control_Package.check_control(
            :controlId,
            :status,
            :checkedBy
          );
        END;
      `;

      const binds = {
        controlId: this.id,
        status: 'activo',
        checkedBy: this.updatedBy
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al realizar verificación: ${error.message}`);
    }
  }
}

// Modelo de Alerta
class SecurityAlert {
  constructor(data) {
    this.id = data.ALERT_Alerta;
    this.type = data.ALERT_tipo;
    this.description = data.ALERT_descripcion;
    this.date = data.ALERT_fecha;
    this.time = data.ALERT_hora;
    this.status = data.ALERT_estado;
    this.incident = data.INS_incidente;
    this.resources = data.ALERT_recursos;
    this.createdBy = data.ALERT_creado_por;
    this.createdAt = data.ALERT_fecha_creacion;
    this.updatedBy = data.ALERT_actualizado_por;
    this.updatedAt = data.ALERT_fecha_actualizacion;
  }

  // Crear nueva alerta
  static async create(data) {
    try {
      const procedure = `
        BEGIN
          AER_Alerta_Package.create_alert(
            :alertId,
            :type,
            :description,
            :date,
            :time,
            :status,
            :incident,
            :resources,
            :createdBy
          );
        END;
      `;

      const binds = {
        alertId: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        type: data.type,
        description: data.description,
        date: data.date,
        time: data.time,
        status: 'pendiente',
        incident: data.incident,
        resources: data.resources,
        createdBy: data.createdBy
      };

      const result = await executeProcedure(procedure, binds);
      return result.outBinds.alertId;
    } catch (error) {
      throw new Error(`Error al crear alerta: ${error.message}`);
    }
  }

  // Obtener alerta por ID
  static async getById(id) {
    try {
      const sql = `
        SELECT A.*, I.INS_tipo incidenteTipo, I.INS_gravedad incidenteGravedad
        FROM AER_Alerta A
        LEFT JOIN AER_Incidente I ON A.INS_incidente = I.INS_Incidente
        WHERE A.ALERT_Alerta = :id
      `;

      const result = await executeQuery(sql, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      return new SecurityAlert(result.rows[0]);
    } catch (error) {
      throw new Error(`Error al obtener alerta: ${error.message}`);
    }
  }

  // Actualizar alerta
  async update(data) {
    try {
      const procedure = `
        BEGIN
          AER_Alerta_Package.update_alert(
            :alertId,
            :status,
            :resources,
            :updatedBy
          );
        END;
      `;

      const binds = {
        alertId: this.id,
        status: data.status || this.status,
        resources: data.resources || this.resources,
        updatedBy: data.updatedBy
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar alerta: ${error.message}`);
    }
  }

  // Obtener alertas activas
  static async getActive() {
    try {
      const sql = `
        SELECT A.*, I.INS_tipo incidenteTipo, I.INS_gravedad incidenteGravedad
        FROM AER_Alerta A
        LEFT JOIN AER_Incidente I ON A.INS_incidente = I.INS_Incidente
        WHERE A.ALERT_estado = 'pendiente'
        ORDER BY A.ALERT_fecha DESC
      `;

      const result = await executeQuery(sql);
      return result.rows.map(row => new SecurityAlert(row));
    } catch (error) {
      throw new Error(`Error al obtener alertas: ${error.message}`);
    }
  }
}

module.exports = {
  SecurityIncident,
  SecurityControl,
  SecurityAlert
};
