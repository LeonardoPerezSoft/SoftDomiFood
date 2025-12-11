/**
 * Coupons Service (Facade Pattern)
 */

import apiClient, { mapResponseToCamelCase } from './apiClient';

const couponsService = {
  /**
   * Validate a coupon code
   * @param {string} code - Coupon code
   * @returns {Promise<object>} Coupon details if valid
   */
  async validate(code) {
    try {
      const response = await apiClient.post('/coupons/validate', { code });
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },
};

export default couponsService;
