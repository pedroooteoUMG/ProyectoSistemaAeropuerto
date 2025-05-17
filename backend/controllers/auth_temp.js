const bcrypt = require('bcryptjs');

// Usuarios de prueba en memoria
const testUsers = {
    'admin@aeropuerto.com': {
        email: 'admin@aeropuerto.com',
        password: bcrypt.hashSync('admin123', 10),
        nombre: 'Administrador',
        apellido: 'Sistema',
        rol: 'administrador',
        estado: 'activo'
    },
    'test@example.com': {
        email: 'test@example.com',
        password: bcrypt.hashSync('test123', 10),
        nombre: 'Test',
        apellido: 'User',
        rol: 'usuario',
        estado: 'activo'
    }
};

// Controlador de Autenticación
const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validar datos
      if (!email || !password) {
        throw new Error('Faltan datos requeridos');
      }

      // Obtener usuario de los usuarios de prueba
      const user = testUsers[email];
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Verificar estado
      if (user.estado !== 'activo') {
        throw new Error('Usuario inactivo');
      }

      // Generar token
      const token = {
        token: 'test-token',
        user: {
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol
        }
      };

      res.json(token);
    } catch (error) {
      console.error('Error en login:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al intentar iniciar sesión'
      });
    }
  }
};

module.exports = authController;
