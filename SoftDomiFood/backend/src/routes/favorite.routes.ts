import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de favoritos requieren autenticación
router.use(authenticate);

// Obtener todos los favoritos del usuario
router.get('/', getFavorites);

// Agregar producto a favoritos
router.post('/', addFavorite);

// Eliminar producto de favoritos
router.delete('/:productId', removeFavorite);

// Verificar si un producto está en favoritos
router.get('/check/:productId', isFavorite);

export default router;
