import React, { useState, useEffect } from 'react';
import { reviewsAPI } from '../../utils/api';

const Star = ({ filled, size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={filled ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}
  >
    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.169L12 18.896l-7.336 3.87 1.402-8.169L.132 9.21l8.2-1.192L12 .587z"/>
  </svg>
);

const ProductReviews = ({ productId, user, toast }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [average, setAverage] = useState(0);
  const [reviews, setReviews] = useState([]);

  const load = async () => {
    try {
      const data = await reviewsAPI.getByProduct(productId);
      setAverage(data.average || 0);
      setReviews(data.reviews || []);
    } catch (e) {
      console.error('Error loading reviews:', e);
    }
  };

  useEffect(() => { load(); }, [productId]);

  const canSubmit = !!user && rating >= 1;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await reviewsAPI.create({ productId, rating, comment: comment?.trim() || null });
      toast && toast.success ? toast.success('¡Gracias por tu reseña!') : null;
      setRating(0);
      setComment('');
      await load();
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Error al enviar reseña';
      if (toast && toast.error) toast.error(msg);
    }
  };

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-800">Calificaciones y Reseñas</h4>
      <div className="flex items-center gap-1 mt-2">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-1"
            title={`${n} estrellas`}
          >
            <Star size={24} filled={(hover || rating) >= n} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">Promedio: {average.toFixed(1)}/5</span>
      </div>

      <div className="mt-3">
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Escribe tu reseña aquí..."
          className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-400"
          rows={4}
          maxLength={2000}
        />
        <div className="flex justify-end mt-2">
          <button
            disabled={!canSubmit}
            onClick={submit}
            className={`px-4 py-2 rounded-lg ${canSubmit ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-600'}`}
          >
            Enviar Reseña
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">Aún no hay reseñas para este producto.</p>
        ) : reviews.map(r => (
          <div key={r.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-800">{r.user_name || 'Usuario'}</div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <span key={n}><Star size={16} filled={r.rating >= n} /></span>
                ))}
              </div>
            </div>
            {r.comment && <p className="text-gray-700 mt-2">{r.comment}</p>}
            {r.createdAt && (
              <div className="text-xs text-gray-400 mt-1">
                {new Date(r.createdAt).toLocaleString('es-ES')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
