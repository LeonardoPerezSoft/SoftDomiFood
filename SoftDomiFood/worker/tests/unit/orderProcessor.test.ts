import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Ejemplo mínimo de unit test: validar cálculo de estado/aplicación de descuento
// En un escenario real, importarías desde src/processors/orderProcessor

function applyDiscount(total: number, coupon?: { type: 'PERCENTAGE'|'AMOUNT', value: number }) {
  if (!coupon) return total;
  if (coupon.type === 'PERCENTAGE') {
    const discount = +(total * (coupon.value / 100)).toFixed(2);
    return +(total - discount).toFixed(2);
  }
  if (coupon.type === 'AMOUNT') {
    return +(total - coupon.value).toFixed(2);
  }
  return total;
}

describe('orderProcessor.applyDiscount', () => {
  it('no aplica descuento cuando no hay cupón', () => {
    assert.equal(applyDiscount(10000), 10000);
  });

  it('aplica descuento porcentual correctamente', () => {
    assert.equal(applyDiscount(10000, { type: 'PERCENTAGE', value: 20 }), 8000);
  });

  it('aplica descuento por monto fijo correctamente', () => {
    assert.equal(applyDiscount(10000, { type: 'AMOUNT', value: 2000 }), 8000);
  });
});
