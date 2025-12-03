/**
 * useFavorites Hook
 * 
 * Custom hook for managing favorites state and operations.
 */

import { useState, useCallback, useEffect } from 'react';
import favoritesService from '../services/favorites.service';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all favorites
   */
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await favoritesService.getAll();
      setFavorites(data);
    } catch (err) {
      setError(err.message || 'Error al cargar favoritos');
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add product to favorites
   * @param {string} productId - Product ID
   */
  const addFavorite = useCallback(async (productId) => {
    if (!productId) {
      throw new Error('productId is required');
    }
    // Don't add if already in favorites
    if (favorites.includes(productId)) {
      return;
    }
    
    const previousFavorites = favorites;
    
    try {
      // Optimistic update: add immediately
      setFavorites(prev => [...prev, productId]);
      
      // Request to backend
      await favoritesService.add(productId);
      
      // Success: dispatch event
      window.dispatchEvent(new CustomEvent('favorite:added', { detail: { productId } }));
    } catch (err) {
      // Rollback on error
      setFavorites(previousFavorites);
      setError(`Error al añadir a favoritos: ${err.message}`);
      console.error('Error adding favorite:', err);
      throw err;
    }
  }, [favorites]);

  /**
   * Remove product from favorites
   * @param {string} productId - Product ID
   */
  const removeFavorite = useCallback(async (productId) => {
    if (!productId) {
      throw new Error('productId is required');
    }
    // Store previous state for rollback
    const previousFavorites = favorites;
    
    try {
      // Optimistic update: remove immediately
      setFavorites(prev => prev.filter(id => id !== productId));
      
      // Request to backend
      await favoritesService.remove(productId);
      
      // Success: dispatch event
      window.dispatchEvent(new CustomEvent('favorite:removed', { detail: { productId } }));
    } catch (err) {
      // Rollback on error
      setFavorites(previousFavorites);
      setError(`Error al eliminar favorito: ${err.message}`);
      console.error('Error removing favorite:', err);
      throw err;
    }
  }, [favorites]);

  /**
   * Toggle favorite status
   * @param {string} productId - Product ID
   */
  const toggleFavorite = useCallback(async (productId) => {
    if (favorites.includes(productId)) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  /**
   * Check if product is favorite
   * @param {string} productId - Product ID
   * @returns {boolean}
   */
  const isFavorite = useCallback((productId) => {
    return favorites.includes(productId);
  }, [favorites]);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    loadFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
