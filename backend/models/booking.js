const { executeQuery, executeProcedure } = require('../services/database');
const { authService } = require('../services/auth');

// Modelo de Reservación
class Booking {
  constructor(data) {
    this.id = data.RES_Reservacion;
    this.flight = data.VUE_vuelo;
    this.passenger = data.PAS_pasajero;
    this.reservationDate = data.RES_fecha_reserva;
    this.price = data.RES_precio_total;
    this.status = data.RES_estado;
    this.seat = data.RES_asiento;
    this.baggageWeight = data.RES_peso_bultos;
    this.specialRequests = data.RES_solicitudes_especiales;
    this.paymentMethod = data.RES_metodo_pago;
    this.paymentStatus = data.RES_estado_pago;
    this.createdBy = data.RES_creado_por;
    this.createdAt = data.RES_fecha_creacion;
    this.updatedBy = data.RES_actualizado_por;
    this.updatedAt = data.RES_fecha_actualizacion;
  }

  // Validar datos de la reservación
  static validate(data) {
    const requiredFields = ['flight', 'passenger', 'price', 'seat'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
    }

    // Validar precio
    if (typeof data.price !== 'number' || data.price <= 0) {
      throw new Error('El precio debe ser un número positivo');
    }

    // Validar asiento
    if (!/^[A-Z]\d+$/.test(data.seat)) {
      throw new Error('Formato de asiento inválido. Debe ser letra seguida de número');
    }

    // Validar peso de bultos
    if (data.baggageWeight && (typeof data.baggageWeight !== 'number' || data.baggageWeight < 0)) {
      throw new Error('El peso de los bultos debe ser un número no negativo');
    }

    // Validar método de pago
    const validPaymentMethods = ['credit_card', 'debit_card', 'cash', 'transfer'];
    if (data.paymentMethod && !validPaymentMethods.includes(data.paymentMethod)) {
      throw new Error(`Método de pago inválido. Opciones válidas: ${validPaymentMethods.join(', ')}`);
    }
  }

  // Crear nueva reservación
  static async create(data) {
    try {
      this.validate(data);

      const procedure = `
        BEGIN
          AER_Reservacion_Package.create_booking(
            :bookingId,
            :flight,
            :passenger,
            :price,
            :seat,
            :baggageWeight,
            :specialRequests,
            :paymentMethod,
            :createdBy
          );
        END;
      `;

      const binds = {
        bookingId: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        flight: data.flight,
        passenger: data.passenger,
        price: data.price,
        seat: data.seat,
        baggageWeight: data.baggageWeight,
        specialRequests: data.specialRequests,
        paymentMethod: data.paymentMethod,
        createdBy: data.createdBy
      };

      const result = await executeProcedure(procedure, binds);
      return result.outBinds.bookingId;
    } catch (error) {
      throw new Error(`Error al crear reservación: ${error.message}`);
    }
  }

  // Obtener reservación por ID
  static async getById(id) {
    try {
      const sql = `
        SELECT B.*, P.PAS_nombre, P.PAS_apellido,
               V.VUE_fecha, V.VUE_hora_salida, V.VUE_hora_llegada,
               A1.AEP_nombre origen, A2.AEP_nombre destino
        FROM AER_Reservacion B
        JOIN AER_Pasajero P ON B.PAS_pasajero = P.PAS_Pasajero
        JOIN AER_Vuelo V ON B.VUE_vuelo = V.VUE_Vuelo
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        WHERE B.RES_Reservacion = :id
      `;

      const result = await executeQuery(sql, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      return new Booking(result.rows[0]);
    } catch (error) {
      throw new Error(`Error al obtener reservación: ${error.message}`);
    }
  }

  // Actualizar reservación
  async update(data) {
    try {
      const procedure = `
        BEGIN
          AER_Reservacion_Package.update_booking(
            :bookingId,
            :flight,
            :passenger,
            :price,
            :seat,
            :baggageWeight,
            :specialRequests,
            :paymentMethod,
            :paymentStatus,
            :updatedBy
          );
        END;
      `;

      const binds = {
        bookingId: this.id,
        flight: data.flight || this.flight,
        passenger: data.passenger || this.passenger,
        price: data.price || this.price,
        seat: data.seat || this.seat,
        baggageWeight: data.baggageWeight || this.baggageWeight,
        specialRequests: data.specialRequests || this.specialRequests,
        paymentMethod: data.paymentMethod || this.paymentMethod,
        paymentStatus: data.paymentStatus || this.paymentStatus,
        updatedBy: data.updatedBy
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al actualizar reservación: ${error.message}`);
    }
  }

  // Eliminar reservación
  static async delete(id) {
    try {
      const procedure = `
        BEGIN
          AER_Reservacion_Package.delete_booking(:bookingId);
        END;
      `;

      await executeProcedure(procedure, { bookingId: id });
    } catch (error) {
      throw new Error(`Error al eliminar reservación: ${error.message}`);
    }
  }

  // Obtener detalles del pasajero
  async getPassengerDetails() {
    try {
      const sql = `
        SELECT P.*, D.PAS_direccion, D.PAS_ciudad, D.PAS_pais,
               C.PAS_telefono, C.PAS_email
        FROM AER_Pasajero P
        LEFT JOIN AER_Direccion D ON P.PAS_Pasajero = D.PAS_Pasajero
        LEFT JOIN AER_Contacto C ON P.PAS_Pasajero = C.PAS_Pasajero
        WHERE P.PAS_Pasajero = :passengerId
      `;

      const result = await executeQuery(sql, [this.passenger]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener detalles del pasajero: ${error.message}`);
    }
  }

  // Obtener detalles del vuelo
  async getFlightDetails() {
    try {
      const sql = `
        SELECT V.*, A1.AEP_nombre origen, A2.AEP_nombre destino,
               A1.AEP_ciudad ciudad_origen, A2.AEP_ciudad ciudad_destino,
               A1.AEP_pais pais_origen, A2.AEP_pais pais_destino,
               L.AER_nombre aerolinea
        FROM AER_Vuelo V
        JOIN AER_Aeropuerto A1 ON V.VUE_aeropuerto_origen = A1.AEP_Aeropuerto
        JOIN AER_Aeropuerto A2 ON V.VUE_aeropuerto_destino = A2.AEP_Aeropuerto
        JOIN AER_Aerolinea L ON V.VUE_aerolinea = L.AER_Aerolinea
        WHERE V.VUE_Vuelo = :flightId
      `;

      const result = await executeQuery(sql, [this.flight]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener detalles del vuelo: ${error.message}`);
    }
  }

  // Obtener estado de pago
  async getPaymentStatus() {
    try {
      const sql = `
        SELECT P.*, B.BAN_nombre banco, C.CAR_numero_tarjeta
        FROM AER_Pago P
        LEFT JOIN AER_Banco B ON P.BAN_banco = B.BAN_Banco
        LEFT JOIN AER_Carta C ON P.CAR_carta = C.CAR_Carta
        WHERE P.RES_reservacion = :bookingId
      `;

      const result = await executeQuery(sql, [this.id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estado de pago: ${error.message}`);
    }
  }

  // Obtener facturas relacionadas
  async getInvoices() {
    try {
      const sql = `
        SELECT F.*, I.IVA_valor iva, I.IVA_porcentaje porcentaje_iva
        FROM AER_Factura F
        LEFT JOIN AER_IVA I ON F.IVA_iva = I.IVA_IVA
        WHERE F.RES_reservacion = :bookingId
        ORDER BY F.FAC_fecha DESC
      `;

      const result = await executeQuery(sql, [this.id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener facturas: ${error.message}`);
    }
  }

  // Obtener equipaje relacionado
  async getBaggage() {
    try {
      const sql = `
        SELECT B.*, T.BAG_tipo, T.BAG_peso_maximo
        FROM AER_Bulto B
        JOIN AER_Tipo_Bulto T ON B.TYP_tipo = T.TYP_Tipo
        WHERE B.RES_reservacion = :bookingId
        ORDER BY B.BAG_fecha_registro
      `;

      const result = await executeQuery(sql, [this.id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener equipaje: ${error.message}`);
    }
  }

  // Generar boleto
  async generateTicket() {
    try {
      const procedure = `
        BEGIN
          AER_Reservacion_Package.generate_ticket(:bookingId, :ticketNumber);
        END;
      `;

      const binds = {
        bookingId: this.id,
        ticketNumber: { type: oracledb.STRING, dir: oracledb.BIND_OUT }
      };

      const result = await executeProcedure(procedure, binds);
      return result.outBinds.ticketNumber;
    } catch (error) {
      throw new Error(`Error al generar boleto: ${error.message}`);
    }
  }

  // Cancelar reservación
  async cancel(reason) {
    try {
      const procedure = `
        BEGIN
          AER_Reservacion_Package.cancel_booking(
            :bookingId,
            :reason,
            :cancelledBy
          );
        END;
      `;

      const binds = {
        bookingId: this.id,
        reason: reason,
        cancelledBy: this.updatedBy
      };

      await executeProcedure(procedure, binds);
      return this;
    } catch (error) {
      throw new Error(`Error al cancelar reservación: ${error.message}`);
    }
  }
}

module.exports = Booking;
