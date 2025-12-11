/**
 * Order Status Domain Module
 * 
 * Centralized mapping of order statuses to UI representations.
 * This follows the Strategy pattern for state visualization.
 * 
 * Principles: SOLID (Single Responsibility) - all status logic in one place
 */

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  ON_DELIVERY: 'on_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  SCHEDULED: 'scheduled',
};

export const STATUS_UI = {
  [ORDER_STATUSES.PENDING]: {
    label: 'Pendiente',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    badgeColor: 'bg-yellow-500',
  },
  [ORDER_STATUSES.CONFIRMED]: {
    label: 'Confirmado',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    badgeColor: 'bg-blue-500',
  },
  [ORDER_STATUSES.PREPARING]: {
    label: 'En preparación',
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
    badgeColor: 'bg-orange-500',
  },
  [ORDER_STATUSES.READY]: {
    label: 'Listo',
    color: 'bg-green-100',
    textColor: 'text-green-800',
    badgeColor: 'bg-green-500',
  },
  [ORDER_STATUSES.ON_DELIVERY]: {
    label: 'En camino',
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
    badgeColor: 'bg-purple-500',
  },
  [ORDER_STATUSES.DELIVERED]: {
    label: 'Entregado',
    color: 'bg-green-50',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-600',
  },
  [ORDER_STATUSES.CANCELLED]: {
    label: 'Cancelado',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-500',
  },
  [ORDER_STATUSES.SCHEDULED]: {
    label: 'Programado',
    color: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    badgeColor: 'bg-indigo-500',
  },
};

/**
 * Get UI representation for an order status
 * @param {string} status - Order status key
 * @returns {object} UI configuration (label, colors)
 */
export function getStatusUI(status) {
  return STATUS_UI[status] || STATUS_UI[ORDER_STATUSES.PENDING];
}

/**
 * Check if an order is in a terminal state (no further changes expected)
 * @param {string} status - Order status
 * @returns {boolean}
 */
export function isTerminalStatus(status) {
  return [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED].includes(status);
}

/**
 * Check if an order can be reviewed by a user
 * (delivered orders can be reviewed)
 * @param {string} status - Order status
 * @returns {boolean}
 */
export function canReviewOrder(status) {
  return status === ORDER_STATUSES.DELIVERED;
}

/**
 * Check if an order is scheduled (pending automatic state transition)
 * @param {string} status - Order status
 * @returns {boolean}
 */
export function isScheduledOrder(status) {
  return status === ORDER_STATUSES.SCHEDULED;
}

/**
 * Get allowed actions for admin based on order status
 * @param {string} status - Order status
 * @returns {string[]} Array of allowed action keys
 */
export function getAllowedAdminActions(status) {
  const actions = {
    [ORDER_STATUSES.PENDING]: ['startPreparing', 'cancel'],
    [ORDER_STATUSES.CONFIRMED]: ['startPreparing', 'cancel'],
    [ORDER_STATUSES.PREPARING]: ['markReady', 'cancel'],
    [ORDER_STATUSES.READY]: ['markOnDelivery', 'cancel'],
    [ORDER_STATUSES.ON_DELIVERY]: ['markDelivered'],
    [ORDER_STATUSES.SCHEDULED]: ['cancel'], // Cannot prepare scheduled orders
    [ORDER_STATUSES.DELIVERED]: [],
    [ORDER_STATUSES.CANCELLED]: [],
  };
  return actions[status] || [];
}
