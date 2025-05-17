const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const { authenticate } = require('../middleware/auth');
const { monitoring } = require('../services/monitoring');

// Obtener todos los usuarios (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.USR_rol !== 'admin') {
      throw new Error('No tienes permisos para ver esta información');
    }

    const users = await User.getAll();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    monitoring.createSystemAlert(
      'users',
      1,
      0,
      `Error al obtener usuarios: ${error.message}`
    );
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Obtener usuario por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    monitoring.createSystemAlert(
      'users',
      1,
      0,
      `Error al obtener usuario: ${error.message}`
    );
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Actualizar usuario
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.USR_rol !== 'admin' && req.user.USR_Usuario !== req.params.id) {
      throw new Error('No tienes permisos para actualizar este usuario');
    }

    const { nombre, apellido, email, estado } = req.body;
    const updates = {};

    if (nombre) updates.nombre = nombre;
    if (apellido) updates.apellido = apellido;
    if (email) updates.email = email;
    if (estado) updates.estado = estado;

    const success = await User.update(req.params.id, updates);
    if (!success) {
      throw new Error('Error al actualizar usuario');
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    monitoring.createSystemAlert(
      'users',
      1,
      0,
      `Error al actualizar usuario: ${error.message}`
    );
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Eliminar usuario (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.USR_rol !== 'admin') {
      throw new Error('No tienes permisos para eliminar usuarios');
    }

    const success = await User.delete(req.params.id);
    if (!success) {
      throw new Error('Error al eliminar usuario');
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    monitoring.createSystemAlert(
      'users',
      1,
      0,
      `Error al eliminar usuario: ${error.message}`
    );
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
