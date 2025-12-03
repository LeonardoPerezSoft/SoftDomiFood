/**
 * Auth Service (Facade Pattern)
 */

import apiClient, { mapResponseToCamelCase } from './apiClient';

const authService = {
  /**
   * Register a new user
   * @param {object} userData - { name, email, password }
   * @returns {Promise<object>} { user, token }
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const data = mapResponseToCamelCase(response.data);
      if (data.token) {
        localStorage.setItem('clientToken', data.token);
        localStorage.setItem('clientUser', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login user
   * @param {object} credentials - { email, password }
   * @param {boolean} isAdmin - Whether this is admin login
   * @returns {Promise<object>} { user, token }
   */
  async login(credentials, isAdmin = false) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const data = mapResponseToCamelCase(response.data);
      if (data.token) {
        localStorage.setItem('clientToken', data.token);
        localStorage.setItem('clientUser', JSON.stringify(data.user));
        localStorage.setItem('token', data.token); // For backward compatibility
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<object>} User profile
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout() {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    localStorage.removeItem('token');
  },

  /**
   * Get stored user from localStorage
   * @returns {object|null} Stored user or null
   */
  getStoredUser() {
    try {
      const user = localStorage.getItem('clientUser');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('clientToken');
  },
};

export default authService;
