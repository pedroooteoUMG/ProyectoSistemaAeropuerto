module.exports = function(data) {
  return `¡Alerta de seguridad! Se ha detectado actividad sospechosa en tu cuenta de Aeropuerto Internacional. Tipo: ${data.activityType}. Fecha: ${data.timestamp}. Si no reconoces esta actividad, cambia tu contraseña inmediatamente.`;
};
