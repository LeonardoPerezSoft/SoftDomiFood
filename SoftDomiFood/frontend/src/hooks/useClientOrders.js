/**
 * useClientOrders Hook
 * 
 * Custom hook for managing client orders state and operations.
 * Encapsulates all order-related logic for client-side operations.
 * 
 * Principles: SOLID (Single Responsibility) - manages only client order state
 */

import { useState, useCallback, useEffect } from 'react';
import ordersService from '../services/orders.service';
import { createOrderPayload, validateOrderPayload } from '../domain/orderFactory';
import { validateOrderForm } from '../domain/validateOrder';

export function useClientOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all orders for current user
   */
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersService.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Error al cargar órdenes');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new order
   * @param {object} params - Order parameters
   * @returns {Promise<object>} Created order
   */
  const createOrder = useCallback(async (params) => {
    try {
      // Validate form
      const formValidation = validateOrderForm(params.orderForm);
      if (!formValidation.valid) {
        throw new Error(Object.values(formValidation.errors)[0]);
      }

      // Create payload
      const payload = createOrderPayload(params);

      // Validate payload
      const payloadValidation = validateOrderPayload(payload);
      if (!payloadValidation.valid) {
        throw new Error(payloadValidation.errors[0]);
      }

      // Submit to API
      const newOrder = await ordersService.createOrder(payload);
      setOrders(prev => [newOrder, ...prev]);
      
      // Emit event for UI refresh
      window.dispatchEvent(new CustomEvent('order:created', { detail: newOrder }));
      
      return newOrder;
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   */
  const cancelOrder = useCallback(async (orderId) => {
    try {
      const updated = await ordersService.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   */
  const getOrder = useCallback(async (orderId) => {
    try {
      return await ordersService.getOrderById(orderId);
    } catch (err) {
      throw err;
    }
  }, []);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    loadOrders,
    createOrder,
    cancelOrder,
    getOrder,
  };
}
