import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (e.g., for attaching auth tokens dynamically)
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (e.g., for global error handling)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful error logging or global logout handling can go here
    return Promise.reject(error);
  }
);

export default API;
