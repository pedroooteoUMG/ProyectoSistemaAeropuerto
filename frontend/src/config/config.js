export const API_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  FLIGHTS: '/dashboard/flights',
  PASSENGERS: '/dashboard/passengers',
  RESERVATIONS: '/dashboard/reservations',
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};
