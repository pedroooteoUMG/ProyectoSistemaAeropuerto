const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../services/database');
const { config } = require('../config');

// Servicio de autenticación
const authService = {
  // Generar JWT
  generateToken: (user) => {
    const payload = {
      id: user.EMP_Empleado,
      role: user.EMP_rol,
      name: user.EMP_nombre,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + parseInt(config.security.jwtExpiresIn)
    };

    return jwt.sign(payload, config.security.jwtSecret);
  },

  // Verificar contraseña
  verifyPassword: async (hashedPassword, password) => {
    return bcrypt.compare(password, hashedPassword);
  },

  // Hashear contraseña
  hashPassword: async (password) => {
    const saltRounds = config.security.passwordSaltRounds;
    return bcrypt.hash(password, saltRounds);
  },

  // Obtener usuario por ID
  getUserById: async (id) => {
    const sql = `
      SELECT EMP_Empleado, EMP_usuario, EMP_password, EMP_rol,
             EMP_nombre, EMP_apellido, EMP_email
      FROM AER_Empleado
      WHERE EMP_Empleado = :id
    `;
    
    const result = await executeQuery(sql, [id]);
    return result.rows[0];
  },

  // Obtener usuario por nombre de usuario
  getUserByUsername: async (username) => {
    const sql = `
      SELECT EMP_Empleado, EMP_usuario, EMP_password, EMP_rol,
             EMP_nombre, EMP_apellido, EMP_email
      FROM AER_Empleado
      WHERE EMP_usuario = :username
    `;
    
    const result = await executeQuery(sql, [username]);
    return result.rows[0];
  },

  // Verificar permisos
  checkPermissions: (user, requiredPermissions) => {
    if (!user || !user.role) {
      return false;
    }

    const rolePermissions = {
      admin: ['all'],
      booking_manager: ['bookings', 'flights'],
      security_manager: ['security', 'reports'],
      report_manager: ['reports'],
      employee: ['bookings']
    };

    const userPermissions = rolePermissions[user.role] || [];
    
    if (requiredPermissions === 'all') {
      return true;
    }

    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.every(permission => 
        userPermissions.includes(permission) || userPermissions.includes('all')
      );
    }

    return userPermissions.includes(requiredPermissions) || userPermissions.includes('all');
  },

  // Validar token
  validateToken: (token) => {
    try {
      return jwt.verify(token, config.security.jwtSecret);
    } catch (error) {
      return null;
    }
  }
};

module.exports = authService;
