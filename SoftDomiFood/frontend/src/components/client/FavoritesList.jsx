import React from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import ProductCard from './ProductCard';

const FavoritesList = ({ 
  favorites, 
  onAddToCart, 
  onToggleFavorite,
  favoriteIds,
  isAuthenticated 
}) => {
  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Inicia sesión para ver tus favoritos
        </h3>
        <p className="text-gray-500">
          Guarda tus productos favoritos para encontrarlos fácilmente después
        </p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No tienes favoritos aún
        </h3>
        <p className="text-gray-500 mb-6">
          Explora nuestro menú y marca tus productos favoritos con el ícono de corazón
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            Mis Favoritos
          </h2>
          <p className="text-gray-600 mt-1">
            {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            isFavorite={favoriteIds.includes(product.id)}
            onToggleFavorite={onToggleFavorite}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritesList;
