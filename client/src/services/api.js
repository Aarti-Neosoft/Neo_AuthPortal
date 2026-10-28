import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('neosoft_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config.url.includes('/login') || error.config.url.includes('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('neosoft_token');
        localStorage.removeItem('neosoft_user');
      }
    }

    let message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0];

    if (!message) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        message = 'Backend server is not reachable on port 5000. Please make sure the backend server is running.';
      } else {
        message = error.message || 'An unexpected network error occurred';
      }
    }

    error.customMessage = message;
    return Promise.reject(error);
  }
);

export default api;
