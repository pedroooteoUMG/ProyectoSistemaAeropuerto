import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { api } from '../../api';

const FlightForm = ({ flights }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fields = [
    { name: 'flightNumber', label: 'Número de Vuelo', type: 'text', required: true },
    { name: 'origin', label: 'Origen', type: 'text', required: true },
    { name: 'destination', label: 'Destino', type: 'text', required: true },
    { name: 'airline', label: 'Aerolínea', type: 'text', required: true },
    { name: 'date', label: 'Fecha', type: 'date', required: true },
    { name: 'departureTime', label: 'Hora de Salida', type: 'time', required: true },
    { name: 'arrivalTime', label: 'Hora de Llegada', type: 'time', required: true },
    { name: 'capacity', label: 'Capacidad', type: 'number', required: true }
  ];

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      await api.createFlight(data);
      // Aquí podríamos agregar código para mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear el vuelo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseForm
      title="Registrar Nuevo Vuelo"
      onSubmit={handleSubmit}
      fields={fields}
      loading={loading}
      error={error}
    />
  );
};

export default FlightForm;
