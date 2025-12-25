import axios from 'axios';

// Use the same base URL as the main api service
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const clientApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for client portal - add client_token to all requests
clientApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('client_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for client portal - handle errors globally
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid for client
      localStorage.removeItem('client_token');
      localStorage.removeItem('client_user');
      // Redirect to client login page
      window.location.href = '/portal/login';
    }
    return Promise.reject(error);
  }
);

export default clientApi;
