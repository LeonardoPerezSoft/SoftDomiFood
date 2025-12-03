# 🧪 Tests de Favoritos - TypeScript/Jest

## 📋 Descripción

Suite completa de tests en TypeScript usando Jest y Supertest para validar la funcionalidad de lista de favoritos en SoftDomiFood.

## 🛠️ Tecnologías

- **Jest**: Framework de testing
- **Supertest**: Testing de APIs HTTP
- **TypeScript**: Tipado estático
- **ts-jest**: Preset de Jest para TypeScript

## 📦 Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

## ▶️ Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Solo tests de favoritos
```bash
npm run test:favorites
```

### Modo watch (re-ejecuta al guardar cambios)
```bash
npm run test:watch
```

### Con reporte de cobertura
```bash
npm run test:coverage
```

## 📁 Estructura

```
backend/
├── src/
│   └── __tests__/
│       ├── setup.ts              # Configuración global de tests
│       └── favorites.test.ts     # Suite completa de tests de favoritos
├── jest.config.js                # Configuración de Jest
└── package.json                  # Scripts de testing
```

## 🧩 Cobertura de Tests

### 1. Autenticación y Acceso (4 tests)
- ✅ CA-AUTH-01: Endpoint requiere autenticación
- ✅ CA-AUTH-02: Rechaza token inválido
- ✅ CA-AUTH-03: Acepta token válido
- ✅ CA-AUTH-04: Token se obtiene correctamente en login

### 2. Obtener Lista de Favoritos - GET (3 tests)
- ✅ CA-GET-01: Devuelve array de favoritos
- ✅ CA-GET-02: Cada favorito incluye información del producto
- ✅ CA-GET-03: Usuario solo ve sus propios favoritos

### 3. Agregar Producto - POST (4 tests)
- ✅ CA-POST-01: Agregar producto exitosamente
- ✅ CA-POST-02: No permite duplicados
- ✅ CA-POST-03: Valida productId requerido
- ✅ CA-POST-04: No permite producto inexistente

### 4. Verificar Favorito - GET CHECK (2 tests)
- ✅ CA-CHECK-01: Verifica producto que es favorito
- ✅ CA-CHECK-02: Verifica producto que NO es favorito

### 5. Eliminar Producto - DELETE (3 tests)
- ✅ CA-DELETE-01: Elimina favorito exitosamente
- ✅ CA-DELETE-02: Verifica que fue eliminado
- ✅ CA-DELETE-03: Eliminar favorito inexistente no causa error

### 6. Flujos de Integración (2 tests)
- ✅ CA-FLOW-01: Flujo completo (agregar → verificar → listar → eliminar)
- ✅ CA-FLOW-02: Agregar múltiples productos

### 7. Rendimiento y Casos Extremos (3 tests)
- ✅ CA-PERF-01: Respuesta rápida (<2s)
- ✅ CA-EDGE-01: ProductId como string
- ✅ CA-EDGE-02: ProductId negativo

**Total: 21 tests**

## 🔧 Configuración

### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};
```

### package.json scripts
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:favorites": "jest favorites"
}
```

## 📊 Ejemplo de Salida

```
 PASS  src/__tests__/favorites.test.ts
  Funcionalidad de Lista de Favoritos
    1. Autenticación y Acceso
      ✓ CA-AUTH-01: Endpoint de favoritos requiere autenticación (45ms)
      ✓ CA-AUTH-02: Endpoint rechaza token inválido (32ms)
      ✓ CA-AUTH-03: Endpoint acepta token válido (28ms)
      ✓ CA-AUTH-04: Token de autenticación se obtiene correctamente en login (5ms)
    2. Obtener Lista de Favoritos (GET /api/favorites)
      ✓ CA-GET-01: Obtener lista de favoritos devuelve array (35ms)
      ✓ CA-GET-02: Cada favorito incluye información del producto (42ms)
      ✓ CA-GET-03: Usuario solo ve sus propios favoritos (38ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        5.234s
```

## 🔑 Requisitos Previos

### 1. Backend en ejecución
```bash
cd backend
npm run dev
```
El servidor debe estar corriendo en `http://localhost:5000`

### 2. Base de datos PostgreSQL
```bash
docker compose up -d postgres
```

### 3. Usuario de prueba
El test usa las credenciales:
- Email: `cliente@test.com`
- Password: `cliente123`

Asegúrate de que este usuario existe en la base de datos o modifica las credenciales en `favorites.test.ts`.

## 🐛 Troubleshooting

### Error: connect ECONNREFUSED
**Problema**: El backend no está corriendo o no está en el puerto 5000.

**Solución**:
```bash
cd backend
npm run dev
```

### Error: Invalid login credentials
**Problema**: El usuario de prueba no existe.

**Solución**: Ejecuta el seed o crea el usuario manualmente:
```bash
npm run prisma:seed
```

### Error: Cannot find module
**Problema**: Dependencias no instaladas.

**Solución**:
```bash
npm install
```

### Tests timeout
**Problema**: Base de datos no responde o servidor lento.

**Solución**: Aumenta el timeout en `jest.config.js`:
```javascript
testTimeout: 30000 // 30 segundos
```

## 📝 Agregar Nuevos Tests

Para agregar tests adicionales, edita `src/__tests__/favorites.test.ts`:

```typescript
describe('Nueva Funcionalidad', () => {
  test('CA-NEW-01: Descripción del test', async () => {
    const response = await request(BASE_URL)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

## 🎯 Mejores Prácticas

1. **Nombres descriptivos**: Usa prefijos como CA-AUTH, CA-GET, CA-POST
2. **Aislamiento**: Cada test debe ser independiente
3. **Limpieza**: Usa `beforeEach`/`afterEach` para setup/teardown
4. **Aserciones claras**: Verifica una cosa a la vez
5. **Cobertura completa**: Prueba casos exitosos y de error

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## ✅ Criterios de Aceptación Validados

Todos los Criterios de Aceptación (CA) definidos en el análisis de requerimientos están cubiertos:

- ✅ **CA-1**: Usuario autenticado puede agregar productos a favoritos
- ✅ **CA-2**: Usuario puede ver su lista de favoritos
- ✅ **CA-3**: Usuario puede eliminar productos de favoritos
- ✅ **CA-4**: Sistema previene duplicados
- ✅ **CA-5**: UI muestra estado de favorito en ProductCard
- ✅ **CA-6**: Cambios se persisten en base de datos
- ✅ **CA-7**: Solo usuario autenticado puede acceder a favoritos

---

**Nota**: Esta suite de tests reemplaza los tests en Python (`test_funcionalidad_favoritos.py` y `test_favoritos_simple.py`) para mantener consistencia con el stack tecnológico del backend (TypeScript/Node.js).
