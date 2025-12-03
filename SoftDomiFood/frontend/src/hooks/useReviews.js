/**
 * useReviews Hook
 * 
 * Custom hook for managing reviews state and operations.
 */

import { useState, useCallback } from 'react';
import reviewsService from '../services/reviews.service';

export function useReviews(productId) {
  const [reviews, setReviews] = useState({ reviews: [], average: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load reviews for a product
   */
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsService.getProductReviews(productId);
      setReviews(data);
    } catch (err) {
      setError(err.message || 'Error al cargar reseñas');
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  /**
   * Create a review
   * @param {object} reviewData - { rating, comment }
   */
  const createReview = useCallback(async (reviewData) => {
    try {
      const payload = { productId, ...reviewData };
      const newReview = await reviewsService.createReview(payload);
      
      // Update local state
      setReviews(prev => ({
        ...prev,
        reviews: [newReview, ...prev.reviews],
        total: prev.total + 1,
      }));

      // Emit event for global refresh
      window.dispatchEvent(new CustomEvent('review:created', { detail: { productId } }));
      
      return newReview;
    } catch (err) {
      throw err;
    }
  }, [productId]);

  /**
   * Check if user can review
   */
  const checkCanReview = useCallback(async () => {
    try {
      return await reviewsService.canReviewProduct(productId);
    } catch (err) {
      throw err;
    }
  }, [productId]);

  return {
    reviews,
    loading,
    error,
    loadReviews,
    createReview,
    checkCanReview,
  };
}
