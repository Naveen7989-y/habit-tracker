import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost && (!envUrl || envUrl.includes('onrender.com'))) {
      return 'http://localhost:5000/api';
    }
  }
  return envUrl || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor: attach token from localStorage if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('habitpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response payload or standard error
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      error: error.response?.data?.error || 'UNKNOWN_ERROR',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
    };

    // If 401 and token is expired/invalid, clear local auth
    if (customError.statusCode === 401) {
      localStorage.removeItem('habitpulse_token');
      localStorage.removeItem('habitpulse_user');
    }

    return Promise.reject(customError);
  }
);

export default api;
