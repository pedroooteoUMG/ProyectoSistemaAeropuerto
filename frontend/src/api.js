const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = {
  async createFlight(flightData) {
    const response = await fetch(`${API_URL}/flights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(flightData)
    });
    return response.json();
  },

  async getFlights() {
    const response = await fetch(`${API_URL}/flights`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async getPassengers() {
    const response = await fetch(`${API_URL}/passengers`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async createReservation(reservationData) {
    const response = await fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(reservationData)
    });
    return response.json();
  },

  async login(credentials) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }
};
