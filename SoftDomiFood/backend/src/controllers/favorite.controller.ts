import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Obtener favoritos del usuario autenticado
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Extraer solo los productos
    const products = favorites.map(fav => fav.product);

    res.json({ 
      favorites: products,
      count: products.length 
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ 
      message: 'Error al obtener favoritos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Agregar producto a favoritos
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!productId) {
      return res.status(400).json({ message: 'productId es requerido' });
    }

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Verificar si ya existe en favoritos
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'El producto ya está en favoritos' });
    }

    // Crear favorito
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId
      },
      include: {
        product: true
      }
    });

    res.status(201).json({ 
      message: 'Producto agregado a favoritos',
      favorite: favorite.product
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ 
      message: 'Error al agregar a favoritos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Eliminar producto de favoritos
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar que el favorito existe
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (!existingFavorite) {
      return res.status(404).json({ message: 'Favorito no encontrado' });
    }

    // Eliminar favorito
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    res.json({ message: 'Producto eliminado de favoritos' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ 
      message: 'Error al eliminar de favoritos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verificar si un producto está en favoritos
export const isFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ 
      message: 'Error al verificar favorito',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
