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
exports.login = async (req, res) => {
    try {
      console.log('Iniciando proceso de login');
      const { email, password } = req.body;
      console.log('Datos recibidos:', { email, passwordReceived: !!password });

      // Validar datos
      if (!email || !password) {
        console.log('Faltan datos:', { email: !!email, password: !!password });
        throw new Error('Faltan datos requeridos');
      }

      // Obtener usuario de los usuarios de prueba
      const user = testUsers[email];
      console.log('Usuario encontrado:', !!user);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña
      const validPassword = bcrypt.compareSync(password, user.password);
      console.log('Contraseña válida:', validPassword);
      
      if (!validPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Verificar estado
      console.log('Estado del usuario:', user.estado);
      if (user.estado !== 'activo') {
        throw new Error('Usuario inactivo');
      }

      // Generar token
      const token = {
        success: true,
        message: 'Login exitoso',
        token: 'test-token',
        user: {
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol
        }
      };

      console.log('Login exitoso para:', email);
      res.json(token);
    } catch (error) {
      console.error('Error en login:', error.message);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al intentar iniciar sesión'
      });
    }
};

exports.logout = async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;

      // Validar email
      if (!email) {
        throw new Error('Email requerido');
      }

      // Obtener usuario
      const user = await User.getByEmail(email);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Generar token temporal
      const token = jwt.sign(
        { userId: user.USR_Usuario, email: user.USR_email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Enviar correo de recuperación
      await notifications.sendEmail(
        email,
        'Recuperación de Contraseña',
        'resetPassword',
        {
          name: user.USR_nombre,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`
        }
      );

      res.json({
        success: true,
        message: 'Correo de recuperación enviado'
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'auth',
        1,
        0,
        `Error en recuperación de contraseña: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};

exports.resetPassword = async (req, res) => {
    try {
      const { token, password } = req.body;

      // Validar datos
      if (!token || !password) {
        throw new Error('Faltan datos requeridos');
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.userId) {
        throw new Error('Token inválido');
      }

      // Actualizar contraseña
      await User.updatePassword(decoded.userId, password);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'auth',
        1,
        0,
        `Error en reseteo de contraseña: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};

exports.getProfile = async (req, res) => {
    try {
      // Obtener usuario
      const user = await User.getByEmail(req.user.email);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      res.json({
        success: true,
        user: {
          id: user.USR_Usuario,
          email: user.USR_email,
          nombre: user.USR_nombre,
          apellido: user.USR_apellido,
          role: user.USR_rol,
          estado: user.USR_estado,
          fecha_creacion: user.USR_fecha_creacion,
          ultimo_login: user.USR_ultimo_login
        }
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'auth',
        1,
        0,
        `Error al obtener perfil: ${error.message}`
      );
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar perfil
exports.updateProfile = async (req, res) => {
    try {
      const { nombre, apellido } = req.body;

      // Validar datos
      if (!nombre || !apellido) {
        throw new Error('Datos requeridos');
      }

      // Actualizar usuario
      const success = await User.update(req.user.userId, {
        nombre,
        apellido
      });

      if (!success) {
        throw new Error('Error al actualizar perfil');
      }

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      });
    } catch (error) {
      monitoring.createSystemAlert(
        'auth',
        1,
        0,
        `Error al actualizar perfil: ${error.message}`
      );
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
