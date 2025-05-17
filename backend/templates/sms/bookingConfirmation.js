module.exports = function(data) {
  return `Tu reserva en Aeropuerto Internacional ha sido confirmada. Referencia: ${data.bookingId}. Origen: ${data.origin}. Destino: ${data.destination}. Fecha: ${data.date}. Para más detalles, accede a tu cuenta.`;
};
