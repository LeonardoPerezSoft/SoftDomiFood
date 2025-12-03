import React from 'react';
import { Plus, Heart } from 'lucide-react';

const ProductCard = ({ product, onAddToCart, isFavorite, onToggleFavorite, isAuthenticated }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative">
        <img
          src={product.image || 'https://placehold.co/300x200/FF6B6B/FFFFFF?text=Producto'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {isAuthenticated && (
          <button
            onClick={() => onToggleFavorite(product.id)}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
              isFavorite 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white text-gray-400 hover:text-red-500 hover:bg-gray-50'
            }`}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
          <span className="text-2xl font-bold text-orange-600">${product.price}</span>
        </div>
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
      </div>
    </div>
  );
};

export default ProductCard;
