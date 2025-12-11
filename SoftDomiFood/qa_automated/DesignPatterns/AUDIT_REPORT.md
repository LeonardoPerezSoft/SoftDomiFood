# Mejoras — Patrones de diseño y refactor para Frontend (React)

Este documento explica cómo aplicar patrones de diseño y refactor al Frontend (React) para mejorar:

- Legibilidad y mantenibilidad (código heredado / "brownfield").
- Separación de responsabilidades (principios SOLID).
- Facilidad de pruebas (principios FIRST).
- Soporte estable de pedidos programados (campo `scheduledFor`).

## 1. Contexto del taller

- Entender el código heredado antes de escribir cosas nuevas.
- Hacer una auditoría: SOLID, patrones aplicables, aciertos vs fallos.
- Proponer y aplicar refactor + pruebas (unitarias e integración) y evidencias.

> Este README puede ser la base de tu `AUDIT_REPORT.md`, adaptándolo a lo que ya cambiaste.

## 2. Problemas típicos detectados en el Front (ClientPage / AdminPage)

### 2.1 "God Component" (ClientPage demasiado grande)

- Mucho estado y muchas responsabilidades en un mismo archivo.
- Lógica de negocio mezclada con render (validaciones, armado del payload, llamadas a la API).
- Duplicación de lógica (p. ej. mapeo de estados a UI en distintos componentes).

### 2.2 Acoplamiento fuerte con la API

- El UI asume formatos de respuesta (snake_case vs camelCase) y campos opcionales.
- Errores no normalizados (a veces `error.response.data.detail`, a veces `error.message`).
- Side effects (loadOrders/loadAddresses/checkAuth) dispersos por varios componentes.

### 2.3 Feature nueva: pedidos programados

- `scheduledFor` es un dato de dominio importante.
- La UI debe mostrar:
	- que un pedido está programado,
	- la fecha/hora de despacho,
	- acciones permitidas (ej.: cancelar sí; preparar depende del negocio).

## 3. Arquitectura propuesta (simple y realista)

Sin reescribir todo: mover lógica a `domain/`, `services/` y `hooks/`.

Estructura sugerida (parcial):

- `src/domain/`
	- `orderStatus.js` (mapeo de estados a UI)
	- `orderFactory.js` (armado de payload)
- `src/services/`
	- `apiClient.js` (configuración axios)
	- `orders.service.js`, `products.service.js` (facades)
- `src/hooks/`
	- `useAuth.js`, `useProducts.js`, `useCart.js`, `useClientOrders.js`, `useAdminOrders.js`
- `src/pages/`
	- `ClientPageContainer.jsx` + `ClientPageView.jsx` (container/view split)
- `src/components/` (client, admin, shared)

La idea: mantener la UI, pero mover lógica a hooks y helpers de dominio para facilitar pruebas y mantenimiento.

## 4. Patrones de diseño (qué aplicar y dónde)

### 4.1 Facade (capa API)

Problema: la UI conoce muchas rutas y formatos.

Solución: crear servicios por módulo que expongan funciones de alto nivel, por ejemplo:

- `ordersService.createOrder(payload)`
- `ordersService.getMyOrders()`
- `adminOrdersService.updateStatus(id, status)`

Beneficio: UI más limpia y pruebas más simples (mockear un módulo único).

### 4.2 Adapter (normalización de respuesta)

Problema: inconsistencias en nombres de campos (`coupon_code` vs `couponCode`).

Solución: mappers/adapters en el service:

- `mapOrderFromApi(raw)`
- `mapOrderItemFromApi(raw)`

Resultado: UI consume modelos consistentes.

### 4.3 Factory (armado del payload de orden)

Problema: ClientPage arma el payload con lógica repetida.

Solución: `createOrderPayload({ cart, orderForm, appliedCoupon, scheduledFor })`

Beneficios:

- Asegura campos mínimos.
- Calcula totales.
- Agrega `couponCode` si existe.
- Agrega `scheduledFor` si aplica.

Ejemplo (`src/domain/orderFactory.js`):

```js
export function createOrderPayload({ cart, orderForm, appliedCoupon, scheduledFor }) {
	const total = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
	return {
		items: cart.map(it => ({ productId: it.id, quantity: it.quantity, price: it.price })),
		addressId: orderForm.addressId,
		paymentMethod: orderForm.paymentMethod,
		notes: orderForm.notes || null,
		total,
		couponCode: appliedCoupon?.code ?? null,
		scheduledFor: scheduledFor || null,
	};
}
```

### 4.4 Strategy (pedido inmediato vs programado)

Problema: la confirmación del pedido cambia según si es inmediato o programado.

Solución: crear una estrategia por tipo de despacho (o al menos encapsular la diferencia en una función):

- `ImmediateOrderStrategy.execute(payload)`
- `ScheduledOrderStrategy.execute(payload)`

En la práctica, una simple función que detecta `scheduledFor` y ajusta el payload/acción es suficiente.

### 4.5 Observer (actualización / reload)

Problema: tras crear/cancelar/actualizar, hay que refrescar varios estados.

Solución: usar un event bus (observer) o una librería como React Query para cache/invalidation.

- Emitir eventos (`orders:changed`) y que hooks los escuchen, o
- Usar `queryClient.invalidateQueries(['orders'])`.

### 4.6 State / Command (transiciones de estado)

En Admin, modelar botones como comandos: `StartPreparingCommand`, `MarkReadyCommand`, `CancelCommand`.

Beneficio: validar transiciones en un solo lugar y evitar acciones inválidas según estado.

## 5. Mejora concreta: mostrar "fecha de despacho" cuando está programado (ADMIN)

Tu backend ya devuelve `scheduledFor` en `get_all_orders()`.

### 5.1 Cambios sugeridos en `OrderManagement.jsx`

1) Añadir un formateador de fechas:

```js
const formatDateTime = (iso) => {
	if (!iso) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleString('es-ES', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
};
```

2) Dentro del render de cada orden, mostrar una franja si el estado es `scheduled`:

```jsx
{status === 'scheduled' && order.scheduledFor && (
	<div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-orange-50 text-orange-700 px-3 py-2 text-sm">
		<Clock className="w-4 h-4" />
		<span><b>Programado:</b> despacho {formatDateTime(order.scheduledFor)}</span>
	</div>
)}
```

3) Nota de negocio: mientras esté `SCHEDULED`, deshabilitar acciones inapropiadas como "Preparar". Solo permitir "Cancelar".

## 6. Mejora para la vista cliente (`MyOrders.jsx`)

Reusar helpers (`src/domain/orderStatus.js`, `src/domain/dateFormat.js`) y mostrar:

- Badge "Programado" cuando corresponda.
- Texto "Programado para: …" con `scheduledFor`.

Ejemplo de `src/domain/orderStatus.js`:

```js
export const STATUS_UI = {
	pending: { label: 'Pendiente' },
	confirmed: { label: 'Confirmado' },
	preparing: { label: 'En preparación' },
	ready: { label: 'Listo' },
	on_delivery: { label: 'En camino' },
	delivered: { label: 'Entregado' },
	cancelled: { label: 'Cancelado' },
	scheduled: { label: 'Programado' },
};
```

## 7. Testing (QA) para estos cambios (principios FIRST)

### 7.1 Unit tests (dominio)

- `createOrderPayload` (total, couponCode, scheduledFor).
- `STATUS_UI` incluye `scheduled`.

### 7.2 Integration tests (backend)

- Crear pedido programado => `status === 'SCHEDULED'` y `scheduledFor` no es null.
- Verificar que pedido programado no se publique en Rabbit inmediatamente.
- Simular avance temporal / job que convierta `SCHEDULED` a `PENDING` y verifique publicación.

### 7.3 Frontend tests (Jest + React Testing Library)

- `OrderManagement` renderiza "Programado: …" si `status === 'SCHEDULED'` y `scheduledFor` existe.
- `MyOrders` idem.

## 8. Nota práctica: ejecutar pytest en PowerShell

Si `pytest` no se reconoce en PowerShell, usar:

```powershell
py -m pip install -r requirements.txt
py -m pip install pytest
py -m pytest -q
```

## 9. Plan de implementación (mini-roadmap)

1. Crear helpers de dominio: `dateFormat.js`, `orderStatus.js`, `orderFactory.js`.
2. Adaptar services (Facade + Adapter).
3. Refactor suave: mover lógica de `ClientPage` a hooks + factory.
4. UI: mostrar `scheduledFor` en Admin `OrderManagement` y en `MyOrders`.
5. Tests: unitarias de dominio e integración backend.

---

Si quieres, puedo generar los archivos de ejemplo (`orderFactory.js`, `orderStatus.js`, `dateFormat.js`) y unos tests unitarios básicos para `createOrderPayload`. ¿Quieres que los agregue ahora? 

• integración backend (si aplica)