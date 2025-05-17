const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // Para desarrollo, usar token de prueba
    if (token === 'test-token') {
      // Simular usuario de prueba
      req.user = {
        email: 'admin@aeropuerto.com',
        rol: 'administrador'
      };
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Error en autenticación'
    });
  }
};

module.exports = authenticate;
