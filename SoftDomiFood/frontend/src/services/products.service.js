/**
 * Products Service (Facade Pattern)
 * 
 * High-level product operations encapsulating API calls and normalization.
 */

import apiClient, { mapResponseToCamelCase } from './apiClient';

/**
 * Normalize product response
 * @param {object} product - Raw product from API
 * @returns {object} Normalized product
 */
function normalizeProduct(product) {
  return mapResponseToCamelCase(product);
}

const productsService = {
  /**
   * Get all products
   * @returns {Promise<array>} Array of products
   */
  async getAll() {
    try {
      const response = await apiClient.get('/products');
      const products = Array.isArray(response.data) ? response.data : response.data.products || [];
      return products.map(normalizeProduct);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<object>} Product details
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return normalizeProduct(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reviews for a product
   * @param {string} id - Product ID
   * @returns {Promise<object>} { average, total, reviews }
   */
  async getReviews(id) {
    try {
      const response = await apiClient.get(`/products/${id}/reviews`);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if current user can review a product
   * @param {string} id - Product ID
   * @returns {Promise<object>} { canReview, reason }
   */
  async canReview(id) {
    try {
      const response = await apiClient.get(`/products/${id}/can-review`);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },
};

export default productsService;
