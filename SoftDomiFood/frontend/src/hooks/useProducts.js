/**
 * useProducts Hook
 * 
 * Custom hook for managing products state and operations.
 */

import { useState, useCallback, useEffect } from 'react';
import productsService from '../services/products.service';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all products
   */
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Error al cargar productos');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get product by ID
   * @param {string} id - Product ID
   */
  const getProduct = useCallback(async (id) => {
    try {
      return await productsService.getById(id);
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Get reviews for a product
   * @param {string} id - Product ID
   */
  const getReviews = useCallback(async (id) => {
    try {
      return await productsService.getReviews(id);
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Check if user can review a product
   * @param {string} id - Product ID
   */
  const canReview = useCallback(async (id) => {
    try {
      return await productsService.canReview(id);
    } catch (err) {
      throw err;
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    loadProducts,
    getProduct,
    getReviews,
    canReview,
  };
}
