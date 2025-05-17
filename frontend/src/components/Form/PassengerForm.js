import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { api } from '../../api';

const PassengerForm = ({ passengers }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fields = [
    { name: 'firstName', label: 'Nombre', type: 'text', required: true },
    { name: 'lastName', label: 'Apellido', type: 'text', required: true },
    { name: 'documentType', label: 'Tipo de Documento', type: 'text', required: true },
    { name: 'documentNumber', label: 'Número de Documento', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Teléfono', type: 'text', required: true },
    { name: 'birthDate', label: 'Fecha de Nacimiento', type: 'date', required: true }
  ];

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      await api.createPassenger(data);
      // Aquí podríamos agregar código para mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear el pasajero');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseForm
      title="Registrar Nuevo Pasajero"
      onSubmit={handleSubmit}
      fields={fields}
      loading={loading}
      error={error}
    />
  );
};

export default PassengerForm;
