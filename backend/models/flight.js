const { executeQuery, executeProcedure } = require('../services/database');
const { authService } = require('../services/auth');

// Modelo de Vuelo
class Flight {
  constructor(data) {
    this.id = data.VUE_Vuelo;
    this.originAirport = data.VUE_aeropuerto_origen;
    this.destinationAirport = data.VUE_aeropuerto_destino;
    this.date = data.VUE_fecha;
    this.departureTime = data.VUE_hora_salida;
    this.arrivalTime = data.VUE_hora_llegada;
    this.airline = data.VUE_aerolinea;
    this.status = data.VUE_estado;
    this.createdBy = data.VUE_creado_por;
    this.createdAt = data.VUE_fecha_creacion;
    this.updatedBy = data.VUE_actualizado_por;
    this.updatedAt = data.VUE_fecha_actualizacion;
  }

  // Validar datos del vuelo
  static validate(data) {
    const requiredFields = ['originAirport', 'destinationAirport', 'date', 'departureTime', 'arrivalTime', 'airline'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
    }

    // Validar formato de hora
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(data.departureTime) || !timeRegex.test(data.arrivalTime)) {
      throw new Error('Formato de hora inválido. Debe ser HH:MM');
    }

    // Validar que la hora de llegada sea después de la salida
    if (data.departureTime >= data.arrivalTime) {
      throw new Error('La hora de llegada debe ser después de la hora de salida');
    }
  }

  // Crear nuevo vuelo
  static async create(data) {
    try {
      this.validate(data);

      const procedure = `
        BEGIN
          AER_Vuelo_Package.create_flight(
            :vueloId,
            :originAirport,
            :destinationAirport,
            :date,
            :departureTime,
            :arrivalTime,
            :airline,
            :createdBy
          );
        END;
      `;

      const binds = {
        vueloId: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        originAirport: data.originAirport,
        destinationAirport: data.destinationAirport,
        date: data.date,
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime,
        airline: data.airline,
        createdBy: data.createdBy
      };

      const result = await executeProcedure(procedure, binds);
      return result.outBinds.vueloId;
    } catch (error) {
      throw new Error(`Error al crear vuelo: ${error.message}`);
    }
  }

  // Obtener vuelo por ID
  static async getById(id) {
    try {
      const sql = `
        SELECT * FROM AER_Vuelo
        WHERE VUE_Vuelo = :id
      `;

      const result = await executeQuery(sql, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      return new Flight(result.rows[0]);
    } catch (error) {
      throw new Error(`Error al obtener vuelo: ${error.message}`);
    }
  }

  // Actualizar vuelo
  async update(data) {
    try {
      const procedure = `
        BEGIN
          AER_Vuelo_Package.update_flight(
            :vueloId,
            :originAirport,
            :destinationAirport,
            :date,
            :departureTime,
            :arrivalTime,
            :airline,
            :updatedBy
          );
        END;
      `;

      const binds = {
        vueloId: this.id,
        originAirport: data.originAirport || this.originAirport,
        destinationAirport: data.destinationAirport || this.destinationAirport,
        date: data.date || this.date,
        departureTime: data.departureTime || this.departureTime,
        arrivalTime: data.arrivalTime || this.arrivalTime,
        airline: data.airline || this.airline,
        updatedBy: data.updatedBy
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar vuelo: ${error.message}`);
    }
  }

  // Eliminar vuelo
  static async delete(id) {
    try {
      const procedure = `
        BEGIN
          AER_Vuelo_Package.delete_flight(:vueloId);
        END;
      `;

      await executeProcedure(procedure, { vueloId: id });
    } catch (error) {
      throw new Error(`Error al eliminar vuelo: ${error.message}`);
    }
  }

  // Obtener escalas del vuelo
  async getEscalas() {
    try {
      const sql = `
        SELECT E.*
        FROM AER_Escala E
        WHERE E.VUE_vuelo = :vueloId
        ORDER BY E.ESC_orden
      `;

      const result = await executeQuery(sql, [this.id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener escalas: ${error.message}`);
    }
  }

  // Obtener reservaciones del vuelo
  async getBookings() {
    try {
      const sql = `
        SELECT R.*, P.PAS_nombre, P.PAS_apellido
        FROM AER_Reservacion R
        JOIN AER_Pasajero P ON R.PAS_pasajero = P.PAS_Pasajero
        WHERE R.VUE_vuelo = :vueloId
        ORDER BY R.RES_fecha_reserva DESC
      `;

      const result = await executeQuery(sql, [this.id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener reservaciones: ${error.message}`);
    }
  }
}

module.exports = Flight;
