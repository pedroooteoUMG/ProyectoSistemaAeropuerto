import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Tabs,
  Tab,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import { setFlights, setPassengers, setReservations, setLoading, setError } from '../store/store';
import { api } from '../api';
import FlightForm from './Form/FlightForm';
import PassengerForm from './Form/PassengerForm';
import ReservationForm from './Form/ReservationForm';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { flights, passengers, reservations, loading, error } = useSelector(state => state.app);
  const [activeTab, setActiveTab] = React.useState('flights');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(setLoading(true));
        
        // Cargar datos según la pestaña activa
        if (activeTab === 'flights') {
          const response = await api.getFlights();
          dispatch(setFlights(response));
        } else if (activeTab === 'passengers') {
          const response = await api.getPassengers();
          dispatch(setPassengers(response));
        }
        
        dispatch(setLoading(false));
      } catch (error) {
        dispatch(setError(error.message));
        dispatch(setLoading(false));
      }
    };

    fetchData();
  }, [activeTab, dispatch]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Aeropuerto Internacional
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 4 }}>
        <Tab label="Vuelos" value="flights" />
        <Tab label="Pasajeros" value="passengers" />
        <Tab label="Reservaciones" value="reservations" />
      </Tabs>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {activeTab === 'flights' ? 'Administrar Vuelos' :
               activeTab === 'passengers' ? 'Administrar Pasajeros' :
               'Administrar Reservaciones'}
            </Typography>
          </Grid>
          
          {loading && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            </Grid>
          )}

          {error && (
            <Grid item xs={12}>
              <Typography color="error" variant="body1">
                {error}
              </Typography>
            </Grid>
          )}

          {!loading && !error && (
            <Grid item xs={12}>
              {activeTab === 'flights' && <FlightForm flights={flights} />}
              {activeTab === 'passengers' && <PassengerForm passengers={passengers} />}
              {activeTab === 'reservations' && <ReservationForm reservations={reservations} />}
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}

export default Dashboard;
