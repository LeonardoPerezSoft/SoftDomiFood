/**
 * Favorites Service (Facade Pattern)
 */

import apiClient, { mapResponseToCamelCase } from './apiClient';

const favoritesService = {
  /**
   * Get all favorites
   * @returns {Promise<array>} Array of favorite product IDs
   */
  async getAll() {
    try {
      const response = await apiClient.get('/favorites');
      return response.data.favorites || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add product to favorites
   * @param {string} productId - Product ID
   * @returns {Promise<object>} Favorite object
   */
  async add(productId) {
    try {
      const response = await apiClient.post('/favorites', { productId });
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove product from favorites
   * @param {string} productId - Product ID
   * @returns {Promise<object>} { message }
   */
  async remove(productId) {
    if (!productId) {
      throw new Error('productId is required');
    }
    try {
      const response = await apiClient.delete(`/favorites/${productId}`);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      console.error(`Error removing favorite ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Check if product is favorite
   * @param {string} productId - Product ID
   * @returns {Promise<object>} { exists: boolean }
   */
  async check(productId) {
    try {
      const response = await apiClient.get(`/favorites/check/${productId}`);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },
};

export default favoritesService;
