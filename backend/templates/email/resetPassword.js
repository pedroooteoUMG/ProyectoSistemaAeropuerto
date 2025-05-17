module.exports = function(data) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Restablecimiento de Contraseña</h1>
        <p>Hola ${data.name},</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña. Para continuar, haz clic en el siguiente enlace:</p>
        <p><a href="${data.resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Restablecer Contraseña</a></p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p>Saludos cordiales,</p>
        <p>El equipo de Aeropuerto Internacional</p>
      </div>
    `,
    text: `Restablecimiento de Contraseña

Hola ${data.name},

Hemos recibido una solicitud para restablecer tu contraseña. Para continuar, haz clic en el siguiente enlace:
${data.resetUrl}

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos cordiales,
El equipo de Aeropuerto Internacional`
  };
};
