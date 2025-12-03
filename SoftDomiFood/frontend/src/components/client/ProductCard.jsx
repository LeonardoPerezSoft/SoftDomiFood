import React, { useState, useEffect } from 'react';
import { Plus, Star, MessageSquare } from 'lucide-react';
import api from '../../utils/api';
import StarRating from '../common/StarRating';
import ProductReviews from './ProductReviews';

const ProductCard = ({ product, onAddToCart }) => {
  const [reviews, setReviews] = useState({ average: 0, total: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escuchar evento global para refrescar reseñas de este producto
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.productId === product.id) {
        loadReviews();
      }
    };
    window.addEventListener('review-submitted', handler);
    return () => window.removeEventListener('review-submitted', handler);
  }, [product.id]);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const { data } = await api.get(`/products/${product.id}/reviews`);
      setReviews({
        average: data?.average || 0,
        total: data?.total || 0,
      });
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews({ average: 0, total: 0 });
    } finally {
      setLoadingReviews(false);
    }
  };

  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <img
        src={product.image || 'https://placehold.co/300x200/FF6B6B/FFFFFF?text=Producto'}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
          <span className="text-2xl font-bold text-orange-600">${product.price}</span>
        </div>
        
        {/* Rating */}
        {!loadingReviews && reviews.total > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={reviews.average} readonly size="sm" />
            <span className="text-sm text-gray-600">
              {reviews.average.toFixed(1)} ({reviews.total} {reviews.total === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
        )}
        
        <p className="text-gray-600 mb-4">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.category}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Toggle Reviews */}
        <div className="mt-4">
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <MessageSquare className="w-4 h-4" />
            {showReviews ? 'Ocultar reseñas' : 'Ver reseñas'}
          </button>
          {showReviews && (
            <div className="mt-3">
              <ProductReviews productId={product.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
