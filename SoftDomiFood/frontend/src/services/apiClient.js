/**
 * API Client Configuration
 * 
 * Centralized axios configuration and interceptors.
 * Handles authentication, error normalization, and response mapping.
 * 
 * Principles: SOLID (Single Responsibility, Dependency Inversion)
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create a normalized API client
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - add authentication token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clientToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - normalize errors and handle auth
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error response
    const normalizedError = {
      status: error.response?.status || null,
      statusText: error.response?.statusText || 'Unknown Error',
      message: error.response?.data?.detail || error.response?.data?.message || error.message || 'Error desconocido',
      data: error.response?.data || null,
      original: error,
    };

    // Handle 401 Unauthorized
    if (normalizedError.status === 401) {
      localStorage.removeItem('clientToken');
      localStorage.removeItem('clientUser');
      // Emit a global event for UI to handle redirect
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(normalizedError);
  }
);

/**
 * Generic response mapper - converts snake_case to camelCase
 * @param {object} data - API response data
 * @returns {object} Mapped data with camelCase keys
 */
function mapResponseToCamelCase(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(mapResponseToCamelCase);

  return Object.keys(data).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    const value = data[key];
    acc[camelKey] = Array.isArray(value) || (typeof value === 'object' && value !== null)
      ? mapResponseToCamelCase(value)
      : value;
    return acc;
  }, {});
}

export { mapResponseToCamelCase };

export default apiClient;
