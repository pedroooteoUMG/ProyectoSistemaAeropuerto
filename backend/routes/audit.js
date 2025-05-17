const express = require('express');
const router = express.Router();
const { AuditController } = require('../controllers/audit');
const { auth } = require('../middleware/auth');

// Middleware de permisos para auditoría
const canAccessAudit = (req, res, next) => {
  if (!req.user.role.includes('admin') && !req.user.role.includes('auditor')) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a la auditoría'
    });
  }
  next();
};

// Obtener registros de auditoría
router.get('/', auth, canAccessAudit, AuditController.getLogs);

// Obtener estadísticas
router.get('/stats', auth, canAccessAudit, AuditController.getStats);

// Obtener logs por usuario
router.get('/user/:userId', auth, canAccessAudit, AuditController.getUserLogs);

// Generar reporte
router.get('/report', auth, canAccessAudit, AuditController.generateReport);

// Limpiar registros antiguos
router.delete('/cleanup', auth, canAccessAudit, AuditController.cleanup);

// Obtener errores
router.get('/errors', auth, canAccessAudit, AuditController.getErrors);

// Obtener logs por tipo
router.get('/type/:type', auth, canAccessAudit, AuditController.getTypeLogs);

module.exports = router;
