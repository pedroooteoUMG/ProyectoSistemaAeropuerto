import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { api } from '../../api';

const ReservationForm = ({ reservations }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fields = [
    { name: 'flightNumber', label: 'Número de Vuelo', type: 'text', required: true },
    { name: 'passengerId', label: 'ID del Pasajero', type: 'text', required: true },
    { name: 'seatNumber', label: 'Número de Asiento', type: 'text', required: true },
    { name: 'class', label: 'Clase', type: 'text', required: true },
    { name: 'price', label: 'Precio', type: 'number', required: true },
    { name: 'status', label: 'Estado', type: 'text', required: true }
  ];

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      await api.createReservation(data);
      // Aquí podríamos agregar código para mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la reservación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseForm
      title="Crear Nueva Reservación"
      onSubmit={handleSubmit}
      fields={fields}
      loading={loading}
      error={error}
    />
  );
};

export default ReservationForm;
