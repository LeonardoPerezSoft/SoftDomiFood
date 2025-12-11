/**
 * validateOrder.test.js
 * Unit tests for order validation logic
 */

import {
  validateScheduledOrder,
  validateOrderForm,
  validateCouponCode,
  validateCartNotEmpty,
  validateCartItems,
} from '../../domain/validateOrder';

describe('validateOrder', () => {
  describe('validateScheduledOrder', () => {
    it('should validate a valid future date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const result = validateScheduledOrder(futureDate);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject past date', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const result = validateScheduledOrder(pastDate);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('debe ser en el futuro');
    });

    it('should reject date too far in future', () => {
      const farFuture = new Date(Date.now() + 100 * 60 * 60 * 1000).toISOString();
      const result = validateScheduledOrder(farFuture, 48);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('no puede programar más de 48');
    });

    it('should reject empty string', () => {
      const result = validateScheduledOrder('');
      expect(result.valid).toBe(false);
    });

    it('should validate restaurant hours if provided', () => {
      const restaurantHours = { open: '09:00', close: '21:00' };
      const afterHours = new Date(Date.now() + 24 * 60 * 60 * 1000);
      afterHours.setHours(23, 0, 0);
      
      const result = validateScheduledOrder(
        afterHours.toISOString(),
        48,
        restaurantHours
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('restaurante está cerrado');
    });
  });

  describe('validateOrderForm', () => {
    const validForm = {
      addressId: 'addr-1',
      paymentMethod: 'credit_card',
      scheduleEnabled: false,
    };

    it('should validate correct form', () => {
      const result = validateOrderForm(validForm);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject missing addressId', () => {
      const result = validateOrderForm({
        ...validForm,
        addressId: null,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.addressId).toBeDefined();
    });

    it('should reject missing paymentMethod', () => {
      const result = validateOrderForm({
        ...validForm,
        paymentMethod: null,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.paymentMethod).toBeDefined();
    });

    it('should validate scheduled order with scheduledFor', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const result = validateOrderForm({
        ...validForm,
        scheduleEnabled: true,
        scheduledFor: futureDate,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject scheduled order without scheduledFor', () => {
      const result = validateOrderForm({
        ...validForm,
        scheduleEnabled: true,
        scheduledFor: null,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.scheduledFor).toBeDefined();
    });
  });

  describe('validateCouponCode', () => {
    it('should accept valid coupon code', () => {
      const result = validateCouponCode('SAVE10');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject empty code', () => {
      const result = validateCouponCode('');
      expect(result.valid).toBe(false);
    });

    it('should reject code too short', () => {
      const result = validateCouponCode('AB');
      expect(result.valid).toBe(false);
    });

    it('should reject code too long', () => {
      const result = validateCouponCode('A'.repeat(51));
      expect(result.valid).toBe(false);
    });

    it('should reject non-string input', () => {
      const result = validateCouponCode(12345);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCartNotEmpty', () => {
    it('should accept non-empty cart', () => {
      const cart = [{ id: 'prod-1', quantity: 1 }];
      const result = validateCartNotEmpty(cart);
      expect(result.valid).toBe(true);
    });

    it('should reject empty cart', () => {
      const result = validateCartNotEmpty([]);
      expect(result.valid).toBe(false);
    });

    it('should reject cart with zero quantities', () => {
      const cart = [{ id: 'prod-1', quantity: 0 }];
      const result = validateCartNotEmpty(cart);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCartItems', () => {
    const validItems = [
      { id: 'prod-1', quantity: 2, price: 100 },
      { id: 'prod-2', quantity: 1, price: 50 },
    ];

    it('should validate correct items', () => {
      const result = validateCartItems(validItems);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject items without ID', () => {
      const result = validateCartItems([{ quantity: 1, price: 100 }]);
      expect(result.valid).toBe(false);
    });

    it('should reject negative quantity', () => {
      const result = validateCartItems([{ id: 'prod-1', quantity: -1, price: 100 }]);
      expect(result.valid).toBe(false);
    });

    it('should reject negative price', () => {
      const result = validateCartItems([{ id: 'prod-1', quantity: 1, price: -100 }]);
      expect(result.valid).toBe(false);
    });
  });
});
