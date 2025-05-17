module.exports = function(data) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc3545;">Alerta de Seguridad</h1>
        <p>Hola ${data.name},</p>
        <p>Hemos detectado una posible actividad sospechosa en tu cuenta:</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p><strong>Tipo de actividad:</strong> ${data.activityType}</p>
          <p><strong>Fecha y hora:</strong> ${data.timestamp}</p>
          <p><strong>IP:</strong> ${data.ip}</p>
        </div>
        <p>Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente y contacta con soporte.</p>
        <p>Saludos cordiales,</p>
        <p>El equipo de Aeropuerto Internacional</p>
      </div>
    `,
    text: `Alerta de Seguridad

Hola ${data.name},

Hemos detectado una posible actividad sospechosa en tu cuenta:
- Tipo de actividad: ${data.activityType}
- Fecha y hora: ${data.timestamp}
- IP: ${data.ip}

Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente y contacta con soporte.

Saludos cordiales,
El equipo de Aeropuerto Internacional`
  };
};
