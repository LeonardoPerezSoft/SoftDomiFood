/**
 * orderFactory.test.js
 * Unit tests for order factory domain logic
 * 
 * Principles: FIRST - Fast, Isolated, Repeatable, Self-verifying, Timely
 */

import {
  createOrderPayload,
  validateOrderPayload,
  calculateOrderTotal,
  isCartEligibleForCoupon,
} from '../../domain/orderFactory';

describe('orderFactory', () => {
  describe('createOrderPayload', () => {
    const mockCart = [
      { id: 'prod-1', quantity: 2, price: 100 },
      { id: 'prod-2', quantity: 1, price: 50 },
    ];

    const mockOrderForm = {
      addressId: 'addr-1',
      paymentMethod: 'credit_card',
      notes: 'Sin cebolla',
    };

    it('should create a valid payload with minimal data', () => {
      const payload = createOrderPayload({
        cart: mockCart,
        orderForm: mockOrderForm,
      });

      expect(payload).toEqual({
        items: [
          { productId: 'prod-1', quantity: 2, price: 100 },
          { productId: 'prod-2', quantity: 1, price: 50 },
        ],
        addressId: 'addr-1',
        paymentMethod: 'credit_card',
        notes: 'Sin cebolla',
        total: 250,
        couponCode: null,
        scheduledFor: null,
      });
    });

    it('should apply coupon discount', () => {
      const coupon = { code: 'SAVE10', discountPercent: 10 };
      const payload = createOrderPayload({
        cart: mockCart,
        orderForm: mockOrderForm,
        appliedCoupon: coupon,
      });

      expect(payload.couponCode).toBe('SAVE10');
      expect(payload.total).toBe(225); // 250 - 25
    });

    it('should include scheduledFor if provided', () => {
      const scheduledFor = '2025-12-05T14:00:00Z';
      const payload = createOrderPayload({
        cart: mockCart,
        orderForm: mockOrderForm,
        scheduledFor,
      });

      expect(payload.scheduledFor).toBe(scheduledFor);
    });

    it('should throw error if cart is empty', () => {
      expect(() => {
        createOrderPayload({
          cart: [],
          orderForm: mockOrderForm,
        });
      }).toThrow('El carrito debe contener al menos un producto');
    });

    it('should throw error if addressId is missing', () => {
      expect(() => {
        createOrderPayload({
          cart: mockCart,
          orderForm: { ...mockOrderForm, addressId: null },
        });
      }).toThrow('La dirección de entrega es requerida');
    });

    it('should throw error if paymentMethod is missing', () => {
      expect(() => {
        createOrderPayload({
          cart: mockCart,
          orderForm: { ...mockOrderForm, paymentMethod: null },
        });
      }).toThrow('El método de pago es requerido');
    });

    it('should round total to 2 decimals', () => {
      const cart = [{ id: 'prod-1', quantity: 3, price: 10.33 }];
      const payload = createOrderPayload({
        cart,
        orderForm: mockOrderForm,
      });

      expect(payload.total).toBe(30.99);
    });
  });

  describe('validateOrderPayload', () => {
    const validPayload = {
      items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
      addressId: 'addr-1',
      paymentMethod: 'credit_card',
      total: 100,
    };

    it('should validate a correct payload', () => {
      const result = validateOrderPayload(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject payload with no items', () => {
      const result = validateOrderPayload({
        ...validPayload,
        items: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Debe contener al menos un producto');
    });

    it('should reject payload with invalid addressId', () => {
      const result = validateOrderPayload({
        ...validPayload,
        addressId: null,
      });
      expect(result.valid).toBe(false);
    });

    it('should reject payload with negative total', () => {
      const result = validateOrderPayload({
        ...validPayload,
        total: -10,
      });
      expect(result.valid).toBe(false);
    });

    it('should validate item quantities and prices', () => {
      const result = validateOrderPayload({
        items: [{ productId: 'prod-1', quantity: -1, price: 100 }],
        addressId: 'addr-1',
        paymentMethod: 'credit_card',
        total: 100,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total without discount or tax', () => {
      const result = calculateOrderTotal(100);
      expect(result).toEqual({
        subtotal: 100,
        discount: 0,
        tax: 0,
        total: 100,
      });
    });

    it('should apply percentage discount', () => {
      const coupon = { discountPercent: 10 };
      const result = calculateOrderTotal(100, coupon);
      expect(result.discount).toBe(10);
      expect(result.total).toBe(90);
    });

    it('should apply fixed discount', () => {
      const coupon = { discountAmount: 15 };
      const result = calculateOrderTotal(100, coupon);
      expect(result.discount).toBe(15);
      expect(result.total).toBe(85);
    });

    it('should apply tax after discount', () => {
      const coupon = { discountPercent: 10 };
      const result = calculateOrderTotal(100, coupon, 10);
      expect(result.discount).toBe(10);
      expect(result.tax).toBe(9); // (100 - 10) * 0.1
      expect(result.total).toBe(99);
    });
  });

  describe('isCartEligibleForCoupon', () => {
    const cart = [
      { id: 'prod-1', quantity: 2, price: 100 },
      { id: 'prod-2', quantity: 1, price: 50 },
    ]; // total: 250

    it('should allow cart that meets minimum', () => {
      const coupon = { minOrderAmount: 200 };
      const result = isCartEligibleForCoupon(cart, coupon);
      expect(result.eligible).toBe(true);
    });

    it('should reject cart below minimum', () => {
      const coupon = { minOrderAmount: 300 };
      const result = isCartEligibleForCoupon(cart, coupon);
      expect(result.eligible).toBe(false);
    });

    it('should allow cart within maximum', () => {
      const coupon = { maxOrderAmount: 300 };
      const result = isCartEligibleForCoupon(cart, coupon);
      expect(result.eligible).toBe(true);
    });

    it('should reject cart above maximum', () => {
      const coupon = { maxOrderAmount: 200 };
      const result = isCartEligibleForCoupon(cart, coupon);
      expect(result.eligible).toBe(false);
    });
  });
});
