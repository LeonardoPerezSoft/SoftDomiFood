# 📝 Implementación de Sistema de Calificaciones y Reseñas

## 📋 Descripción General

Se implementó un sistema completo de calificaciones y reseñas para la plataforma SoftDomiFood, permitiendo a los clientes calificar y comentar sobre los productos que han recibido en sus pedidos entregados.

---

## 🎯 Historia de Usuario

**Como** cliente que ya recibió su pedido  
**Quiero** calificar los productos que compré  
**Para** compartir mi experiencia y mejorar el servicio

---

## 🏗️ Arquitectura de la Solución

### 1. Base de Datos

**Tabla: `reviews`**

Campos:
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key → users)
- `productId`: UUID (Foreign Key → products)
- `orderId`: UUID (Foreign Key → orders)
- `rating`: INTEGER (1-5)
- `comment`: TEXT (opcional)
- `createdAt`: TIMESTAMP

Restricciones:
- Constraint único: `(userId, productId, orderId)` - Un usuario solo puede reseñar un producto una vez por pedido
- Check: `rating BETWEEN 1 AND 5`
- Índices en `productId` y `userId` para optimizar consultas

**Archivo:** `api/init_db.py`

---

### 2. Backend (API)

#### 2.1 Servicios de Base de Datos

**Archivo:** `api/services/database_service.py`

**Funciones implementadas:**

1. `user_can_review_product(user_id, product_id)`: Verifica si el usuario puede reseñar el producto. Retorna el orderId si tiene un pedido DELIVERED con ese producto.

2. `create_review(user_id, product_id, order_id, rating, comment)`: Crea una nueva reseña. Lanza excepción si ya existe reseña para esa combinación.

3. `get_product_reviews(product_id)`: Obtiene todas las reseñas y el promedio de calificación de un producto. Retorna: `{ "average": float, "reviews": list }`

#### 2.2 Router de API

**Archivo:** `api/routers/reviews.py`

**Endpoints:**

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/reviews` | ✅ Requerida | Crear nueva reseña |
| GET | `/api/products/{product_id}/reviews` | ❌ Pública | Obtener reseñas de un producto |

**Request Body (POST):**
```json
{
  "productId": "uuid",
  "rating": 5,
  "comment": "Excelente producto"
}
```

**Response (GET):**
```json
{
  "average": 4.5,
  "reviews": [
    {
      "id": "uuid",
      "userId": "uuid",
      "productId": "uuid",
      "orderId": "uuid",
      "rating": 5,
      "comment": "Muy bueno",
      "createdAt": "2025-12-02T10:30:00",
      "user_name": "Juan Pérez"
    }
  ]
}
```

#### 2.3 Reglas de Negocio

1. **Solo clientes con pedidos entregados pueden reseñar**
   - Se valida que el pedido esté en estado `DELIVERED`
   - Se verifica que el producto esté en ese pedido

2. **Una reseña por producto por pedido**
   - El constraint único previene duplicados
   - Si intenta reseñar dos veces, recibe error 409 Conflict

3. **Calificación obligatoria (1-5 estrellas)**
   - El comentario es opcional
   - Rating se valida tanto en frontend como backend

---

### 3. Frontend

#### 3.1 Cliente API

**Archivo:** `frontend/src/utils/api.js`

```javascript
export const reviewsAPI = {
  create: async ({ productId, rating, comment }) => {
    const response = await api.post('/reviews', { productId, rating, comment });
    return response.data;
  },
  getByProduct: async (productId) => {
    const response = await api.get(`/products/${productId}/reviews`);
    return response.data;
  },
};
```

#### 3.2 Componente de Reseñas

**Archivo:** `frontend/src/components/client/ProductReviews.jsx`

**Características:**
- ⭐ Sistema de estrellas interactivo (hover y click)
- 📝 Textarea para comentarios (máx. 2000 caracteres)
- 📊 Muestra promedio de calificaciones
- 📋 Lista de reseñas con nombre de usuario y fecha
- 🔒 Validación de usuario autenticado
- ⏳ Estados de carga y error

#### 3.3 Integración en Tarjeta de Producto

**Archivo:** `frontend/src/components/client/ProductCard.jsx`

El componente `ProductReviews` se integra dentro de cada tarjeta de producto, recibiendo:
- `productId`: ID del producto
- `user`: Usuario autenticado actual
- `toast`: Sistema de notificaciones

---

## 🔧 Problemas Encontrados y Soluciones

### Problema 1: Virtual Environment con Rutas Incorrectas
**Error:** `Unable to create process using 'python.exe'`

**Solución:**
```powershell
Remove-Item -Recurse -Force venv -ErrorAction SilentlyContinue
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Problema 2: Dependencias que Requieren Compilación
**Error:** `psycopg2-binary` necesitaba compilar y fallaba en Windows

**Solución:**
- Actualizado `requirements.txt` con versiones más recientes que tienen binarios pre-compilados
- Cambiado a usar solo `asyncpg` (eliminar `psycopg2-binary`)
- Configurar `passlib` con `pbkdf2_sha256` en lugar de `bcrypt` si hay problemas de compilación

### Problema 3: Archivo .env.local Faltante
**Error:** `No se encuentra la ruta .env.local`

**Solución:**
Creado script `create-env-files.ps1` que genera automáticamente:
- `api/.env.local`
- `worker/.env.local`

### Problema 4: Usuario de Prueba sin Credenciales Válidas
**Error:** `Invalid credentials` al hacer login

**Solución:**
Creado script SQL para generar usuario de prueba con hash bcrypt correcto:
```sql
INSERT INTO users (id, name, email, password, role, phone, address, "createdAt")
VALUES (
    gen_random_uuid(), 
    'Cliente Test', 
    'cliente@test.com', 
    '$2b$12$hash_generado_correctamente', 
    'CUSTOMER', 
    '1234567890', 
    'Calle Test 123', 
    NOW()
);
```

### Problema 5: Token "Invalid" en Swagger
**Causa:** Configuración incorrecta de JWT o formato de autorización

**Solución:**
1. Verificar que `JWT_SECRET` en `.env` coincida con el usado al emitir tokens
2. Reiniciar servidor después de cambiar `.env`
3. En Swagger Authorize: pegar `Bearer ESPACIO + token` (sin comillas)
4. Generar token fresco con POST `/api/auth/login`

### Problema 6: Botón de Enviar Reseña Deshabilitado
**Causa:** Props `user` y `toast` no se pasaban a `ProductCard`

**Solución:**
Actualizado `frontend/src/pages/ClientPage.jsx`:
```jsx
<ProductCard 
  key={product.id}
  product={product}
  onAddToCart={addToCart}
  user={user}
  toast={toast}
/>
```

### Problema 7: Contenedor de PostgreSQL con Nombre Incorrecto
**Error:** `No such container: softdomifood-postgres-1`

**Solución:**
```powershell
# Encontrar nombre real
docker ps

# Usar nombre correcto
docker exec -it softdomifood-db psql -U postgres -d softdomifood
```

---

## 🚀 Guía de Uso

### Para Desarrolladores

**1. Iniciar el proyecto completo:**
```powershell
.\start-local.ps1
```

**2. Crear archivos de configuración:**
```powershell
.\create-env-files.ps1
```

**3. Iniciar servicios:**

Terminal 1 - Backend API:
```powershell
cd api
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

Terminal 2 - Worker:
```powershell
cd worker
npm install
npm run dev
```

Terminal 3 - Frontend:
```powershell
cd frontend
npm install
npm run dev
```

**4. Crear usuario de prueba:**
```powershell
cd api
.\venv\Scripts\python.exe create_test_user.py
```

### Para Probar en Swagger

**URLs:**
- API Docs: http://localhost:5000/docs
- Frontend: http://localhost:5173
- RabbitMQ: http://localhost:15672

**Flujo de prueba:**

1. **Login:** POST `/api/auth/login` con `{ "email": "cliente@test.com", "password": "password123" }`
2. **Autorizar:** Click 🔒, pegar `Bearer TOKEN`
3. **Crear pedido:** POST `/api/orders` con productId válido
4. **Marcar entregado:** PATCH `/api/admin/orders/{order_id}/status` → `{ "status": "DELIVERED" }`
5. **Crear reseña:** POST `/api/reviews` con productId del pedido
6. **Ver reseñas:** GET `/api/products/{product_id}/reviews`

---

## 📊 Estructura de Archivos

```
SoftDomiFood/
├── api/
│   ├── init_db.py                          # ✅ Tabla reviews
│   ├── services/database_service.py         # ✅ CRUD reviews
│   ├── routers/reviews.py                   # ✅ Nuevo router
│   ├── main.py                              # ✅ Router registrado
│   ├── create_test_user.py                  # ✅ Usuario prueba
│   └── .env.local                           # ✅ Config local
├── frontend/
│   ├── src/utils/api.js                     # ✅ reviewsAPI
│   ├── src/components/client/
│   │   ├── ProductReviews.jsx               # ✅ Nuevo componente
│   │   └── ProductCard.jsx                  # ✅ Integración
│   └── src/pages/ClientPage.jsx             # ✅ Props actualizados
├── create-env-files.ps1                     # ✅ Generador .env
├── start-local.ps1                          # ✅ Script inicio
└── IMPLEMENTACION_REVIEWS.md                # 📄 Este documento
```

---

## ✅ Checklist de Funcionalidad

- [x] Tabla reviews con constraints
- [x] Índices optimizados
- [x] Validación pedido DELIVERED
- [x] CRUD de reseñas
- [x] Router API (POST/GET)
- [x] Cliente API frontend
- [x] Componente UI estrellas
- [x] Integración en producto
- [x] Validación autenticación
- [x] Manejo errores/carga
- [x] Constraint único
- [x] Cálculo promedio
- [x] Listado reseñas
- [x] Scripts configuración
- [x] Usuario de prueba
- [x] Documentación completa

---

## 🔒 Seguridad

1. Autenticación requerida para crear reseñas
2. Validación propiedad del pedido
3. Límite 2000 caracteres en comentarios
4. Sanitización de inputs backend
5. Tokens JWT con expiración 120min
6. CORS configurado

---

## 📈 Mejoras Futuras

- Edición de reseñas
- Eliminación de reseñas propias
- Reportar reseñas (admin)
- Respuestas del negocio
- Filtros (rating, fecha)
- Paginación
- Imágenes en reseñas
- Badge verificación compra
- Estadísticas avanzadas
- Notificaciones

---

## 📞 Soporte

- Logs backend: terminal uvicorn
- Consola navegador: F12
- Base de datos: `docker exec -it softdomifood-db psql -U postgres -d softdomifood`
- Swagger: http://localhost:5000/docs

---

**Fecha:** 2 de diciembre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Completado y funcional