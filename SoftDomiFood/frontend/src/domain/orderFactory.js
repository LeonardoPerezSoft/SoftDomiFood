/**
 * Order Factory Domain Module
 * 
 * Factory pattern for creating order payloads.
 * Encapsulates all business logic for order payload construction.
 * 
 * Principles: SOLID (Single Responsibility, Open/Closed) - one place for order creation logic
 */

/**
 * Create a normalized order payload for API submission
 * @param {object} params - Order parameters
 * @param {array} params.cart - Cart items array
 * @param {object} params.orderForm - Form data (addressId, paymentMethod, notes)
 * @param {object} params.appliedCoupon - Applied coupon object (code, discountPercent, discountAmount)
 * @param {string} params.scheduledFor - ISO datetime string for scheduled orders (optional)
 * @returns {object} Normalized order payload
 * @throws {Error} If required parameters are missing or invalid
 */
export function createOrderPayload({
  cart = [],
  orderForm = {},
  appliedCoupon = null,
  scheduledFor = null,
}) {
  // Validation
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error('El carrito debe contener al menos un producto');
  }

  if (!orderForm.addressId) {
    throw new Error('La dirección de entrega es requerida');
  }

  if (!orderForm.paymentMethod) {
    throw new Error('El método de pago es requerido');
  }

  // Calculate total
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Apply coupon discount if present
  let total = subtotal;
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.discountAmount || 
                     (subtotal * (appliedCoupon.discountPercent || 0)) / 100;
    total = Math.max(0, subtotal - discountAmount);
  }

  // Build items array
  const items = cart.map(item => ({
    productId: item.id,
    quantity: item.quantity,
    price: item.price,
  }));

  // Build payload
  const payload = {
    items,
    addressId: orderForm.addressId,
    paymentMethod: orderForm.paymentMethod,
    notes: orderForm.notes || null,
    total: Math.round(total * 100) / 100, // Round to 2 decimals
    couponCode: appliedCoupon?.code ?? null,
    scheduledFor: scheduledFor || null,
  };

  return payload;
}

/**
 * Validate order payload before sending to API
 * @param {object} payload - Order payload
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateOrderPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload inválido'] };
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('Debe contener al menos un producto');
  }

  if (!payload.addressId || typeof payload.addressId !== 'string') {
    errors.push('ID de dirección es requerido');
  }

  if (!payload.paymentMethod || typeof payload.paymentMethod !== 'string') {
    errors.push('Método de pago es requerido');
  }

  if (typeof payload.total !== 'number' || payload.total < 0) {
    errors.push('Total debe ser un número positivo');
  }

  // Validate items
  payload.items.forEach((item, idx) => {
    if (!item.productId) {
      errors.push(`Producto ${idx} sin ID`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors.push(`Producto ${idx} cantidad debe ser positiva`);
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      errors.push(`Producto ${idx} precio inválido`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate order total with all discounts and taxes (if applicable)
 * @param {number} subtotal - Base subtotal
 * @param {object} coupon - Coupon object (optional)
 * @param {number} taxPercent - Tax percentage (optional, default 0)
 * @returns {object} { subtotal, discount, tax, total }
 */
export function calculateOrderTotal(subtotal, coupon = null, taxPercent = 0) {
  let discount = 0;

  if (coupon) {
    discount = coupon.discountAmount || 
               (subtotal * (coupon.discountPercent || 0)) / 100;
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = (afterDiscount * taxPercent) / 100;
  const total = afterDiscount + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Check if a cart is eligible for a coupon
 * @param {array} cart - Cart items
 * @param {object} coupon - Coupon to validate
 * @returns {object} { eligible: boolean, reason: string|null }
 */
export function isCartEligibleForCoupon(cart, coupon) {
  if (!coupon) {
    return { eligible: false, reason: 'No hay cupón' };
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      eligible: false,
      reason: `Compra mínima de $${coupon.minOrderAmount}`,
    };
  }

  if (coupon.maxOrderAmount && subtotal > coupon.maxOrderAmount) {
    return {
      eligible: false,
      reason: `Compra máxima de $${coupon.maxOrderAmount}`,
    };
  }

  return { eligible: true, reason: null };
}
