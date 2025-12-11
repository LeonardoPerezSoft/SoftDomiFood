/**
 * orderStatus.test.js
 * Unit tests for order status domain logic
 */

import {
  ORDER_STATUSES,
  STATUS_UI,
  getStatusUI,
  isTerminalStatus,
  canReviewOrder,
  isScheduledOrder,
  getAllowedAdminActions,
} from '../../domain/orderStatus';

describe('orderStatus', () => {
  describe('getStatusUI', () => {
    it('should return UI config for valid status', () => {
      const ui = getStatusUI('pending');
      expect(ui.label).toBe('Pendiente');
      expect(ui.color).toBeDefined();
      expect(ui.textColor).toBeDefined();
      expect(ui.badgeColor).toBeDefined();
    });

    it('should return default UI for unknown status', () => {
      const ui = getStatusUI('unknown_status');
      expect(ui).toEqual(STATUS_UI[ORDER_STATUSES.PENDING]);
    });

    it('should have UI for all defined statuses', () => {
      Object.values(ORDER_STATUSES).forEach(status => {
        const ui = getStatusUI(status);
        expect(ui).toBeDefined();
        expect(ui.label).toBeDefined();
      });
    });
  });

  describe('isTerminalStatus', () => {
    it('should return true for delivered status', () => {
      expect(isTerminalStatus('delivered')).toBe(true);
    });

    it('should return true for cancelled status', () => {
      expect(isTerminalStatus('cancelled')).toBe(true);
    });

    it('should return false for pending status', () => {
      expect(isTerminalStatus('pending')).toBe(false);
    });

    it('should return false for preparing status', () => {
      expect(isTerminalStatus('preparing')).toBe(false);
    });
  });

  describe('canReviewOrder', () => {
    it('should return true only for delivered orders', () => {
      expect(canReviewOrder('delivered')).toBe(true);
      expect(canReviewOrder('pending')).toBe(false);
      expect(canReviewOrder('preparing')).toBe(false);
      expect(canReviewOrder('ready')).toBe(false);
    });
  });

  describe('isScheduledOrder', () => {
    it('should return true for scheduled status', () => {
      expect(isScheduledOrder('scheduled')).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(isScheduledOrder('pending')).toBe(false);
      expect(isScheduledOrder('preparing')).toBe(false);
      expect(isScheduledOrder('delivered')).toBe(false);
    });
  });

  describe('getAllowedAdminActions', () => {
    it('should allow startPreparing and cancel for pending', () => {
      const actions = getAllowedAdminActions('pending');
      expect(actions).toContain('startPreparing');
      expect(actions).toContain('cancel');
    });

    it('should only allow cancel for scheduled orders', () => {
      const actions = getAllowedAdminActions('scheduled');
      expect(actions).toEqual(['cancel']);
      expect(actions).not.toContain('startPreparing');
    });

    it('should not allow actions for delivered orders', () => {
      const actions = getAllowedAdminActions('delivered');
      expect(actions).toEqual([]);
    });

    it('should not allow actions for cancelled orders', () => {
      const actions = getAllowedAdminActions('cancelled');
      expect(actions).toEqual([]);
    });

    it('should allow markReady for preparing status', () => {
      const actions = getAllowedAdminActions('preparing');
      expect(actions).toContain('markReady');
      expect(actions).toContain('cancel');
    });

    it('should allow markOnDelivery for ready status', () => {
      const actions = getAllowedAdminActions('ready');
      expect(actions).toContain('markOnDelivery');
    });

    it('should only allow markDelivered for on_delivery', () => {
      const actions = getAllowedAdminActions('on_delivery');
      expect(actions).toEqual(['markDelivered']);
    });
  });
});
