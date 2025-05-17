// controllers/auth.js

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  // Ejemplo estático (puedes cambiar por consulta a BD)
  if (username === 'admin' && password === '1234') {
    return res.status(200).json({
      token: 'fake-jwt-token',
      user: { username: 'admin', role: 'admin' }
    });
  }

  return res.status(401).json({ message: 'Credenciales inválidas' });
};

exports.register = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  // Simulación de guardado de usuario (sin BD real)
  console.log('Usuario registrado:', username);

  return res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: { username }
  });
};

exports.logout = (req, res) => {
  console.log('Sesión cerrada');
  return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Correo electrónico requerido' });
  }

  console.log('Recuperación de contraseña solicitada para:', email);

  return res.status(200).json({
    message: 'Correo de recuperación enviado (simulado)'
  });
};
