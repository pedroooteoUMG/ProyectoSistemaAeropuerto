const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Usuario admin en memoria
const users = {
  admin: {
    username: 'admin',
    password: '$2a$10$h.zen5xV66/vQSTQwjgyyOEdEePmwYJB3mZGO8fVWdCsCG8iG2Dq2', // admin123
    role: 'ADMIN'
  }
};

// Función auxiliar para verificar credenciales
async function verifyCredentials(username, password) {
  const user = users[username];
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    }

    const user = await verifyCredentials(username, password);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign({
      username: user.username,
      role: user.role
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

    // Guardar token en la sesión
    req.session.token = token;
    req.session.user = { username: user.username, role: user.role };

    return res.status(200).json({
      token,
      user: { username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.logout = (req, res) => {
  // Destruir la sesión
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
    // Limpiar la cookie de sesión
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Correo electrónico requerido' });
  }

  // Simulación de envío de correo
  console.log('Recuperación de contraseña solicitada para:', email);
  return res.status(200).json({
    message: 'Instrucciones para recuperar contraseña enviadas al correo'
  });
};

exports.register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  if (users[username]) {
    return res.status(400).json({ message: 'Usuario ya existe' });
  }

  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario
    users[username] = {
      username,
      password: hashedPassword,
      role: 'USER'
    };

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: { username }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ message: 'Error al registrar usuario' });
  }
};
