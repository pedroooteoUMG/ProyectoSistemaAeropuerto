const { executeQuery, executeProcedure } = require('../services/database');
const { monitoring } = require('../services/monitoring');
const { notifications } = require('../services/notifications');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Modelo de Usuario
class User {
  // Crear nuevo usuario
  static async create(data) {
    try {
      // Validar datos
      if (!data.email || !data.password || !data.role) {
        throw new Error('Faltan datos requeridos');
      }

      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      // Insertar usuario
      const sql = `
        INSERT INTO AER_Usuario (
          USR_email,
          USR_password,
          USR_nombre,
          USR_apellido,
          USR_rol,
          USR_estado,
          USR_fecha_creacion,
          USR_ultimo_login
        ) VALUES (
          :email,
          :password,
          :nombre,
          :apellido,
          :rol,
          :estado,
          SYSDATE,
          SYSDATE
        )
        RETURNING USR_Usuario INTO :userId
      `;

      const binds = {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        nombre: data.nombre,
        apellido: data.apellido,
        estado: 'activo',
        roles: data.roles || [data.role],
        userId: { type: oracledb.STRING, dir: oracledb.BIND_OUT }
      };

      // Insertar usuario
      const result = await executeQuery(sql, binds);
      const userId = result.outBinds.userId[0];

      // Asignar roles
      for (const role of binds.roles) {
        await executeProcedure('AER_Asignar_Rol', {
          p_usuario_id: userId,
          p_rol_id: role
        });
      }

      // Enviar correo de bienvenida
      await notifications.sendEmail(
        data.email,
        'Bienvenido al Aeropuerto Internacional',
        'welcome',
        {
          name: `${data.nombre} ${data.apellido}`,
          username: data.email,
          role: data.role,
          loginUrl: `${process.env.FRONTEND_URL}/login`
        }
      );

      // Crear token temporal
      const token = jwt.sign(
        { userId, email: data.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        message: 'Usuario creado exitosamente',
        token,
        userId
      };
    } catch (error) {
      monitoring.createSystemAlert(
        'users',
        1,
        0,
        `Error al crear usuario: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener usuario por email
  static async getByEmail(email) {
    try {
      const sql = `
        SELECT 
          USR_Usuario,
          USR_email,
          USR_password,
          USR_nombre,
          USR_apellido,
          USR_rol,
          USR_estado,
          USR_fecha_creacion,
          USR_ultimo_login
        FROM AER_Usuario
        WHERE LOWER(USR_email) = LOWER(:email)
      `;

      const result = await executeQuery(sql, { email });
      return result.rows[0];
    } catch (error) {
      monitoring.createSystemAlert(
        'users',
        1,
        0,
        `Error al obtener usuario: ${error.message}`
      );
      throw error;
    }
  }

  // Actualizar usuario
  static async update(userId, data) {
    try {
      // Preparar datos
      const updates = [];
      const binds = { userId };

      if (data.email) {
        updates.push('USR_email = :email');
        binds.email = data.email.toLowerCase();
      }

      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        updates.push('USR_password = :password');
        binds.password = hashedPassword;
      }

      if (data.nombre) {
        updates.push('USR_nombre = :nombre');
        binds.nombre = data.nombre;
      }

      if (data.apellido) {
        updates.push('USR_apellido = :apellido');
        binds.apellido = data.apellido;
      }

      if (data.role) {
        updates.push('USR_rol = :role');
        binds.role = data.role;
      }

      if (data.estado) {
        updates.push('USR_estado = :estado');
        binds.estado = data.estado;
      }

      // Actualizar usuario
      const sql = `
        UPDATE AER_Usuario
        SET ${updates.join(', ')}
        WHERE USR_Usuario = :userId
      `;

      const result = await executeQuery(sql, binds);
      return result.rowsAffected > 0;
    } catch (error) {
      monitoring.createSystemAlert(
        'users',
        1,
        0,
        `Error al actualizar usuario: ${error.message}`
      );
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(userId) {
    try {
      // Desactivar usuario en lugar de eliminar
      const sql = `
        UPDATE AER_Usuario
        SET USR_estado = 'inactivo',
            USR_fecha_baja = SYSDATE
        WHERE USR_Usuario = :userId
      `;

      const result = await executeQuery(sql, { userId });
      return result.rowsAffected > 0;
    } catch (error) {
      monitoring.createSystemAlert(
        'users',
        1,
        0,
        `Error al eliminar usuario: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async getAll(filters = {}) {
    try {
      const sql = `
        SELECT 
          USR_Usuario,
          USR_email,
          USR_nombre,
          USR_apellido,
          USR_rol,
          USR_estado,
          USR_fecha_creacion,
          USR_ultimo_login
        FROM AER_Usuario
        WHERE (:email IS NULL OR LOWER(USR_email) LIKE '%' || LOWER(:email) || '%')
        AND (:role IS NULL OR USR_rol = :role)
        AND (:estado IS NULL OR USR_estado = :estado)
        ORDER BY USR_fecha_creacion DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;

      const binds = {
        email: filters.email,
        role: filters.role,
        estado: filters.estado,
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit
      };

      const result = await executeQuery(sql, binds);
      return result.rows;
    } catch (error) {
      monitoring.createSystemAlert(
        'users',
        1,
        0,
        `Error al obtener usuarios: ${error.message}`
      );
      throw error;
    }
  }

  // Verificar contraseña
  static async verifyPassword(userId, password) {
    try {
      const user = await this.getByEmail(userId);
      if (!user) return false;

      return await bcrypt.compare(password, user.USR_password);
    } catch (error) {
      monitoring.createSystemAlert(
        'users',
        1,
        0,
        `Error al verificar contraseña: ${error.message}`
      );
      throw error;
    }
  }

  // Generar token de acceso
  static generateToken(userId, email, role) {
    try {
      return jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    } catch (error) {
      monitoring.createSystemAlert(
        'auth',
        1,
        0,
        `Error al generar token: ${error.message}`
      );
      throw error;
    }
  }

  // Verificar token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      monitoring.createSystemAlert(
        'auth',
        1,
        0,
        `Error al verificar token: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener roles disponibles
  static getRoles() {
    return [
      'admin',
      'supervisor',
      'operador',
      'auditor',
      'soporte'
    ];
  }
}

module.exports = User;
