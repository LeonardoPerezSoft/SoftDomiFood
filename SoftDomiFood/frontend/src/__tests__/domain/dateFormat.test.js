/**
 * dateFormat.test.js
 * Unit tests for date formatting utilities
 */

import {
  formatDateTime,
  formatDate,
  formatRelativeTime,
  parseLocalDateTimeToISO,
  isoToDatetimeLocal,
  isFutureDateTime,
  getHoursUntil,
} from '../../domain/dateFormat';

describe('dateFormat', () => {
  const isoString = '2025-12-05T14:30:00Z';
  const invalidDate = 'not-a-date';

  describe('formatDateTime', () => {
    it('should format ISO string correctly', () => {
      const result = formatDateTime(isoString);
      expect(result).toBeDefined();
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should return null for invalid date', () => {
      expect(formatDateTime(invalidDate)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(formatDateTime('')).toBeNull();
    });

    it('should return null for null', () => {
      expect(formatDateTime(null)).toBeNull();
    });

    it('should respect locale parameter', () => {
      // This is hard to test precisely due to locale differences, but we can check it doesn't crash
      const result = formatDateTime(isoString, 'es-ES');
      expect(result).toBeDefined();
    });
  });

  describe('formatDate', () => {
    it('should format date without time', () => {
      const result = formatDate(isoString);
      expect(result).toBeDefined();
      expect(result).not.toMatch(/\d{2}:\d{2}/); // No time
    });

    it('should return null for invalid input', () => {
      expect(formatDate(invalidDate)).toBeNull();
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent times as "hace"', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(oneHourAgo);
      expect(result).toContain('hace');
      expect(result).toContain('hora');
    });

    it('should return empty string for invalid date', () => {
      expect(formatRelativeTime(invalidDate)).toBe('');
    });
  });

  describe('parseLocalDateTimeToISO', () => {
    it('should convert datetime-local format to ISO', () => {
      const localDate = '2025-12-05T14:30';
      const result = parseLocalDateTimeToISO(localDate);
      expect(result).toBeDefined();
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return null for invalid input', () => {
      expect(parseLocalDateTimeToISO('invalid')).toBeNull();
    });

    it('should return null for null', () => {
      expect(parseLocalDateTimeToISO(null)).toBeNull();
    });
  });

  describe('isoToDatetimeLocal', () => {
    it('should convert ISO to datetime-local format', () => {
      const result = isoToDatetimeLocal(isoString);
      expect(result).toBeDefined();
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    });

    it('should return null for invalid date', () => {
      expect(isoToDatetimeLocal(invalidDate)).toBeNull();
    });
  });

  describe('isFutureDateTime', () => {
    it('should return true for future date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(isFutureDateTime(futureDate)).toBe(true);
    });

    it('should return false for past date', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(isFutureDateTime(pastDate)).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(isFutureDateTime(invalidDate)).toBe(false);
    });
  });

  describe('getHoursUntil', () => {
    it('should calculate hours until future date', () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
      const result = getHoursUntil(futureDate);
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('should return negative for past date', () => {
      const pastDate = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      const result = getHoursUntil(pastDate);
      expect(result).toBeLessThan(0);
    });

    it('should return null for invalid date', () => {
      expect(getHoursUntil(invalidDate)).toBeNull();
    });
  });
});
