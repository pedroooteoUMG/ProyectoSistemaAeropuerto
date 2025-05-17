module.exports = function(data) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">¡Bienvenido a Aeropuerto Internacional!</h1>
        <p>Hola ${data.name},</p>
        <p>Gracias por registrarte en nuestro sistema. Aquí tienes algunos datos importantes:</p>
        <ul style="list-style-type: none; padding: 0;">
          <li><strong>Usuario:</strong> ${data.username}</li>
          <li><strong>Email:</strong> ${data.email}</li>
        </ul>
        <p>Si necesitas ayuda, no dudes en contactarnos.</p>
        <p>Saludos cordiales,</p>
        <p>El equipo de Aeropuerto Internacional</p>
      </div>
    `,
    text: `Bienvenido a Aeropuerto Internacional!

Hola ${data.name},

Gracias por registrarte en nuestro sistema. Aquí tienes algunos datos importantes:
- Usuario: ${data.username}
- Email: ${data.email}

Si necesitas ayuda, no dudes en contactarnos.

Saludos cordiales,
El equipo de Aeropuerto Internacional`
  };
};
