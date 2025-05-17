const jwt = require('jsonwebtoken');
const { authService } = require('../services/auth');
const { config } = require('../config');
const { logger } = require('./logging');

// Middleware básico de autenticación
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Token no proporcionado', {
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret);
    const user = await authService.getUserById(decoded.id);

    if (!user) {
      logger.warn('Usuario no encontrado', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: decoded.id
      });
      
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Error en autenticación', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      error: error.message
    });
    
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Middleware de autorización por permisos
const authorize = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!permissions.length) {
        return next();
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
      }

      const hasPermission = authService.checkPermissions(req.user, permissions);

      if (!hasPermission) {
        logger.warn('Permiso denegado', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          userId: req.user.id,
          requiredPermissions: permissions,
          userRole: req.user.role
        });
        
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción'
        });
      }

      next();
    } catch (error) {
      logger.error('Error en autorización', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Middleware para refrescar token
const refreshToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
      return next();
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp;
    
    // Si el token expira en menos de 30 minutos, refrescar
    if (exp - now < 1800) {
      const user = await authService.getUserById(decoded.id);
      if (user) {
        const newToken = authService.generateToken(user);
        res.setHeader('x-refresh-token', newToken);
      }
    }

    next();
  } catch (error) {
    logger.error('Error al refrescar token', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      error: error.message
    });
    
    next();
  }
};

// Middleware para auditoría
const audit = async (req, res, next) => {
  try {
    const auditData = {
      timestamp: new Date(),
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip,
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query
    };

    // Guardar en base de datos
    const sql = `
      INSERT INTO AER_Auditoria (
        AUD_usuario,
        AUD_ip,
        AUD_metodo,
        AUD_url,
        AUD_body,
        AUD_query,
        AUD_fecha
      ) VALUES (
        :userId,
        :ip,
        :method,
        :url,
        :body,
        :query,
        SYSDATE
      )
    `;

    const binds = {
      userId: auditData.userId,
      ip: auditData.ip,
      method: auditData.method,
      url: auditData.url,
      body: JSON.stringify(auditData.body),
      query: JSON.stringify(auditData.query)
    };

    await executeQuery(sql, binds);
    
    next();
  } catch (error) {
    logger.error('Error en auditoría', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      error: error.message
    });
    
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  refreshToken,
  audit
};
