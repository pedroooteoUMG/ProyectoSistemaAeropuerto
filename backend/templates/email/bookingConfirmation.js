module.exports = function(data) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Confirmación de Reserva</h1>
        <p>Hola ${data.name},</p>
        <p>Tu reserva ha sido confirmada exitosamente. Aquí tienes los detalles:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p><strong>Referencia:</strong> ${data.bookingId}</p>
          <p><strong>Fecha:</strong> ${data.date}</p>
          <p><strong>Origen:</strong> ${data.origin}</p>
          <p><strong>Destino:</strong> ${data.destination}</p>
        </div>
        <p>Para ver los detalles completos de tu reserva, accede a tu cuenta.</p>
        <p>Saludos cordiales,</p>
        <p>El equipo de Aeropuerto Internacional</p>
      </div>
    `,
    text: `Confirmación de Reserva

Hola ${data.name},

Tu reserva ha sido confirmada exitosamente. Aquí tienes los detalles:
- Referencia: ${data.bookingId}
- Fecha: ${data.date}
- Origen: ${data.origin}
- Destino: ${data.destination}

Para ver los detalles completos de tu reserva, accede a tu cuenta.

Saludos cordiales,
El equipo de Aeropuerto Internacional`
  };
};
