import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Container>
  );
}

export default App;
