import { createSlice, configureStore } from '@reduxjs/toolkit';

const initialState = {
  flights: [],
  passengers: [],
  reservations: [],
  loading: false,
  error: null
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setFlights: (state, action) => {
      state.flights = action.payload;
    },
    setPassengers: (state, action) => {
      state.passengers = action.payload;
    },
    setReservations: (state, action) => {
      state.reservations = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setFlights,
  setPassengers,
  setReservations,
  setLoading,
  setError
} = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer
  }
});
