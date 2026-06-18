import axios from 'axios';

// Get base URL from environment variable or default to localhost:9090
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global responses/errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      // Redirect to login handled at router level or App level
    }
    return Promise.reject(error);
  }
);
