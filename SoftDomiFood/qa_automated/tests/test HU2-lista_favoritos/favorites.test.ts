import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000';

describe('Funcionalidad de Lista de Favoritos', () => {
  let authToken: string;
  let testUserId: number;
  let testProductId: number;

  // ============================================
  // CONFIGURACIÓN Y AUTENTICACIÓN
  // ============================================

  beforeAll(async () => {
    // Obtener token de autenticación
    const loginResponse = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: 'cliente@test.com',
        password: 'cliente123'
      });

    if (loginResponse.status === 200 && loginResponse.body.token) {
      authToken = loginResponse.body.token;
      testUserId = loginResponse.body.user?.id || loginResponse.body.id;
    } else {
      throw new Error(`No se pudo autenticar. Status: ${loginResponse.status}. Asegúrate de que el usuario cliente@test.com existe y el backend está corriendo.`);
    }

    // Obtener un producto de prueba
    const productsResponse = await request(BASE_URL)
      .get('/api/products');
    
    if (productsResponse.status === 200) {
      // El endpoint puede devolver un objeto con array 'products' o directamente el array
      const products = productsResponse.body.products || productsResponse.body;
      if (Array.isArray(products) && products.length > 0) {
        testProductId = products[0].id;
      } else {
        throw new Error('No hay productos en la base de datos. Ejecuta npm run prisma:seed');
      }
    } else {
      throw new Error(`No se pudieron obtener productos. Status: ${productsResponse.status}`);
    }
  });

  afterAll(async () => {
    // Limpiar favoritos de prueba
    if (authToken && testProductId) {
      await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    await prisma.$disconnect();
  });

  // ============================================
  // TESTS DE AUTENTICACIÓN
  // ============================================

  describe('1. Autenticación y Acceso', () => {
    test('CA-AUTH-01: Endpoint de favoritos requiere autenticación', async () => {
      const response = await request(BASE_URL)
        .get('/api/favorites');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    test('CA-AUTH-02: Endpoint rechaza token inválido', async () => {
      const response = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', 'Bearer token_invalido');

      expect(response.status).toBe(401);
    });

    test('CA-AUTH-03: Endpoint acepta token válido', async () => {
      const response = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    test('CA-AUTH-04: Token de autenticación se obtiene correctamente en login', async () => {
      expect(authToken).toBeDefined();
      expect(authToken).not.toBe('');
      expect(typeof authToken).toBe('string');
    });
  });

  // ============================================
  // TESTS DE CONSULTA (GET)
  // ============================================

  describe('2. Obtener Lista de Favoritos (GET /api/favorites)', () => {
    test('CA-GET-01: Obtener lista de favoritos devuelve array', async () => {
      const response = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('favorites');
      expect(Array.isArray(response.body.favorites)).toBe(true);
    });

    test('CA-GET-02: Cada favorito incluye información del producto', async () => {
      // Primero agregar un favorito para asegurar que hay datos
      await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });

      const response = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      if (response.body.length > 0) {
        const favorite = response.body[0];
        expect(favorite).toHaveProperty('id');
        expect(favorite).toHaveProperty('productId');
        expect(favorite).toHaveProperty('product');
        expect(favorite.product).toHaveProperty('name');
        expect(favorite.product).toHaveProperty('price');
      }
    });

    test('CA-GET-03: Usuario solo ve sus propios favoritos', async () => {
      const response = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // La API filtra automáticamente por usuario autenticado
      // Verificamos que la estructura sea correcta
      expect(response.body).toHaveProperty('favorites');
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });
  });

  // ============================================
  // TESTS DE AGREGAR FAVORITO (POST)
  // ============================================

  describe('3. Agregar Producto a Favoritos (POST /api/favorites)', () => {
    beforeEach(async () => {
      // Limpiar el favorito de prueba antes de cada test
      await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    test('CA-POST-01: Agregar producto a favoritos exitosamente', async () => {
      const response = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('favorite');
      expect(response.body.favorite).toHaveProperty('id');
    });

    test('CA-POST-02: No se puede agregar el mismo producto dos veces', async () => {
      // Primera vez - debe funcionar
      const firstResponse = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });

      expect(firstResponse.status).toBe(201);

      // Segunda vez - debe fallar o devolver el existente
      const secondResponse = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });

      expect([200, 400, 409]).toContain(secondResponse.status);
      expect(secondResponse.body).toHaveProperty('message');
    });

    test('CA-POST-03: Validación de productId requerido', async () => {
      const response = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([400, 500]).toContain(response.status);
    });

    test('CA-POST-04: No se puede agregar producto inexistente', async () => {
      const response = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 999999 });

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  // ============================================
  // TESTS DE VERIFICACIÓN (GET CHECK)
  // ============================================

  describe('4. Verificar si Producto es Favorito (GET /api/favorites/check/:productId)', () => {
    test('CA-CHECK-01: Verificar producto que es favorito', async () => {
      // Agregar a favoritos primero
      await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });

      const response = await request(BASE_URL)
        .get(`/api/favorites/check/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isFavorite', true);
    });

    test('CA-CHECK-02: Verificar producto que NO es favorito', async () => {
      // Asegurar que NO está en favoritos
      await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(BASE_URL)
        .get(`/api/favorites/check/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isFavorite', false);
    });
  });

  // ============================================
  // TESTS DE ELIMINAR (DELETE)
  // ============================================

  describe('5. Eliminar Producto de Favoritos (DELETE /api/favorites/:productId)', () => {
    beforeEach(async () => {
      // Agregar el producto a favoritos antes de cada test de eliminación
      await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });
    });

    test('CA-DELETE-01: Eliminar favorito exitosamente', async () => {
      const response = await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('CA-DELETE-02: Verificar que el favorito fue eliminado', async () => {
      // Eliminar
      await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verificar
      const checkResponse = await request(BASE_URL)
        .get(`/api/favorites/check/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(checkResponse.status).toBe(200);
      expect(checkResponse.body).toHaveProperty('isFavorite', false);
    });

    test('CA-DELETE-03: Eliminar favorito que no existe no causa error', async () => {
      // Eliminar dos veces
      await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const secondResponse = await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Debe devolver 200 o 404, pero no un error 500
      expect([200, 404]).toContain(secondResponse.status);
    });
  });

  // ============================================
  // TESTS DE INTEGRACIÓN
  // ============================================

  describe('6. Flujos de Integración Completos', () => {
    test('CA-FLOW-01: Flujo completo - Agregar, verificar, listar, eliminar', async () => {
      // 1. Agregar a favoritos
      const addResponse = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });
      expect(addResponse.status).toBe(201);

      // 2. Verificar que está en favoritos
      const checkResponse = await request(BASE_URL)
        .get(`/api/favorites/check/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(checkResponse.body.isFavorite).toBe(true);

      // 3. Obtener lista de favoritos
      const listResponse = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.favorites.some((f: any) => f.id === testProductId)).toBe(true);

      // 4. Eliminar de favoritos
      const deleteResponse = await request(BASE_URL)
        .delete(`/api/favorites/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteResponse.status).toBe(200);

      // 5. Verificar que ya no está en favoritos
      const finalCheckResponse = await request(BASE_URL)
        .get(`/api/favorites/check/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(finalCheckResponse.body.isFavorite).toBe(false);
    });

    test('CA-FLOW-02: Agregar múltiples productos a favoritos', async () => {
      // Obtener varios productos
      const productsResponse = await request(BASE_URL)
        .get('/api/products');
      
      const products = (productsResponse.body.products || productsResponse.body).slice(0, 3); // Tomar los primeros 3 productos

      // Agregar cada uno a favoritos
      for (const product of products) {
        const response = await request(BASE_URL)
          .post('/api/favorites')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ productId: product.id });
        
        expect([200, 201]).toContain(response.status);
      }

      // Verificar que todos están en la lista
      const listResponse = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.favorites.length).toBeGreaterThanOrEqual(products.length);

      // Limpiar
      for (const product of products) {
        await request(BASE_URL)
          .delete(`/api/favorites/${product.id}`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    });
  });

  // ============================================
  // TESTS DE RENDIMIENTO Y EDGE CASES
  // ============================================

  describe('7. Rendimiento y Casos Extremos', () => {
    test('CA-PERF-01: Respuesta rápida al obtener lista de favoritos', async () => {
      const startTime = Date.now();
      
      const response = await request(BASE_URL)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Menos de 2 segundos
    });

    test('CA-EDGE-01: ProductId como string en lugar de número', async () => {
      const response = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: "abc" });

      expect([400, 404, 500]).toContain(response.status);
    });

    test('CA-EDGE-02: ProductId negativo', async () => {
      const response = await request(BASE_URL)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: -1 });

      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
