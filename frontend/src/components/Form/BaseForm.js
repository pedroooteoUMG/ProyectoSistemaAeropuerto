import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

const BaseForm = ({ title, onSubmit, fields, loading, error }) => {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {title}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {fields.map((field, index) => (
          <TextField
            key={index}
            fullWidth
            margin="normal"
            {...field}
            value={formData[field.name] || ''}
            onChange={handleChange}
          />
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default BaseForm;
