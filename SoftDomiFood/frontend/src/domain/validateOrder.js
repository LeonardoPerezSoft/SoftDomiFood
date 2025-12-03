/**
 * Order Validation Domain Module
 * 
 * Centralized validation logic for order-related operations.
 * Encapsulates business rules for scheduled and immediate orders.
 * 
 * Principles: SOLID (Single Responsibility) - all validation in one place
 */

/**
 * Validate scheduled order parameters
 * @param {string} scheduledFor - ISO datetime string
 * @param {number} maxHoursAhead - Maximum hours to schedule ahead (default: 48)
 * @param {object} restaurantHours - Restaurant operating hours { open: 'HH:mm', close: 'HH:mm' }
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateScheduledOrder(
  scheduledFor,
  maxHoursAhead = 48,
  restaurantHours = null
) {
  const errors = [];

  if (!scheduledFor) {
    errors.push('Debe especificar fecha y hora de entrega');
    return { valid: false, errors };
  }

  try {
    const scheduledDate = new Date(scheduledFor);
    const now = new Date();

    // Check if date is in the future
    if (scheduledDate <= now) {
      errors.push('La fecha de entrega debe ser en el futuro');
    }

    // Check max hours ahead
    const hoursAhead = (scheduledDate - now) / (1000 * 60 * 60);
    if (hoursAhead > maxHoursAhead) {
      errors.push(`No puede programar más de ${maxHoursAhead} horas adelante`);
    }

    // Check restaurant hours if provided
    if (restaurantHours) {
      const scheduledHour = scheduledDate.getHours();
      const scheduledMinute = scheduledDate.getMinutes();
      const [openHour, openMin] = restaurantHours.open.split(':').map(Number);
      const [closeHour, closeMin] = restaurantHours.close.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      const scheduledMinutes = scheduledHour * 60 + scheduledMinute;

      if (scheduledMinutes < openMinutes || scheduledMinutes >= closeMinutes) {
        errors.push(
          `El restaurante está cerrado a esa hora. Horario: ${restaurantHours.open} - ${restaurantHours.close}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (e) {
    return {
      valid: false,
      errors: ['Fecha y hora inválida'],
    };
  }
}

/**
 * Validate order form data
 * @param {object} formData - Form data to validate
 * @param {string} formData.addressId - Selected address ID
 * @param {string} formData.paymentMethod - Selected payment method
 * @param {boolean} formData.scheduleEnabled - Whether order is scheduled
 * @param {string} formData.scheduledFor - Scheduled datetime if enabled
 * @returns {object} { valid: boolean, errors: { [field]: string } }
 */
export function validateOrderForm(formData) {
  const errors = {};

  if (!formData.addressId) {
    errors.addressId = 'Debe seleccionar una dirección de entrega';
  }

  if (!formData.paymentMethod) {
    errors.paymentMethod = 'Debe seleccionar un método de pago';
  }

  if (formData.scheduleEnabled) {
    if (!formData.scheduledFor) {
      errors.scheduledFor = 'Debe especificar fecha y hora de entrega';
    } else {
      const validation = validateScheduledOrder(formData.scheduledFor);
      if (!validation.valid) {
        errors.scheduledFor = validation.errors[0];
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate coupon code format
 * @param {string} code - Coupon code to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateCouponCode(code) {
  if (!code) {
    return { valid: false, error: 'Código de cupón es requerido' };
  }

  if (typeof code !== 'string') {
    return { valid: false, error: 'Código de cupón inválido' };
  }

  if (code.trim().length < 3) {
    return { valid: false, error: 'Código debe tener al menos 3 caracteres' };
  }

  if (code.trim().length > 50) {
    return { valid: false, error: 'Código no debe exceder 50 caracteres' };
  }

  return { valid: true, error: null };
}

/**
 * Validate cart is not empty
 * @param {array} cart - Cart items
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateCartNotEmpty(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return { valid: false, error: 'El carrito está vacío' };
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems === 0) {
    return { valid: false, error: 'El carrito está vacío' };
  }

  return { valid: true, error: null };
}

/**
 * Validate cart items quantities and prices
 * @param {array} cart - Cart items to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateCartItems(cart) {
  const errors = [];

  if (!Array.isArray(cart)) {
    errors.push('Carrito inválido');
    return { valid: false, errors };
  }

  cart.forEach((item, idx) => {
    if (!item.id) {
      errors.push(`Producto ${idx}: sin ID`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors.push(`Producto ${idx}: cantidad debe ser positiva`);
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      errors.push(`Producto ${idx}: precio inválido`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
