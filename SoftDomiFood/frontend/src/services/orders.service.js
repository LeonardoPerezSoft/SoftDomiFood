/**
 * Orders Service (Facade Pattern)
 * 
 * High-level order operations encapsulating API calls, normalization, and error handling.
 * Provides a clean interface for components to work with orders.
 * 
 * Principles: SOLID (Facade, Adapter) - single point for all order operations
 */

import apiClient, { mapResponseToCamelCase } from './apiClient';

/**
 * Normalize order response from API
 * @param {object} order - Raw order from API
 * @returns {object} Normalized order
 */
function normalizeOrder(order) {
  const normalized = mapResponseToCamelCase(order);
  return {
    ...normalized,
    // Ensure items array exists
    items: Array.isArray(normalized.items) ? normalized.items : [],
    // Ensure total is a number
    total: typeof normalized.total === 'number' ? normalized.total : 0,
    // Ensure status is lowercase
    status: normalized.status?.toLowerCase() || 'pending',
  };
}

const ordersService = {
  /**
   * Create a new order
   * @param {object} orderData - Order payload
   * @returns {Promise<object>} Created order
   * @throws {object} Normalized error
   */
  async createOrder(orderData) {
    try {
      const response = await apiClient.post('/orders', orderData);
      return normalizeOrder(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all orders for current user
   * @returns {Promise<array>} Array of orders
   * @throws {object} Normalized error
   */
  async getMyOrders() {
    try {
      const response = await apiClient.get('/orders');
      const orders = Array.isArray(response.data) ? response.data : response.data.orders || [];
      return orders.map(normalizeOrder);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<object>} Order details
   * @throws {object} Normalized error
   */
  async getOrderById(orderId) {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return normalizeOrder(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get order status
   * @param {string} orderId - Order ID
   * @returns {Promise<object>} { status: string }
   * @throws {object} Normalized error
   */
  async getOrderStatus(orderId) {
    try {
      const response = await apiClient.get(`/orders/${orderId}/status`);
      return mapResponseToCamelCase(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @returns {Promise<object>} Updated order
   * @throws {object} Normalized error
   */
  async cancelOrder(orderId) {
    try {
      const response = await apiClient.patch(`/orders/${orderId}/cancel`);
      return normalizeOrder(response.data);
    } catch (error) {
      throw error;
    }
  },
};

export default ordersService;
