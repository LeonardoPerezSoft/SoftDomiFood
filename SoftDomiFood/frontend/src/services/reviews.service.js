/**
 * Reviews Service (Facade Pattern)
 */

import apiClient, { mapResponseToCamelCase } from './apiClient';

const reviewsService = {
  /**
   * Create a review for a product
   * @param {object} reviewData - { productId, rating, comment }
   * @returns {Promise<object>} Created review
   */
  async createReview(reviewData) {
    try {
      const response = await apiClient.post('/reviews', reviewData);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reviews for a product
   * @param {string} productId - Product ID
   * @returns {Promise<object>} { average, total, reviews }
   */
  async getProductReviews(productId) {
    try {
      const response = await apiClient.get(`/products/${productId}/reviews`);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user can review a product
   * @param {string} productId - Product ID
   * @returns {Promise<object>} { canReview, reason }
   */
  async canReviewProduct(productId) {
    try {
      const response = await apiClient.get(`/products/${productId}/can-review`);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },
};

export default reviewsService;
