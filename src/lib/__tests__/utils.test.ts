import { describe, it, expect } from 'vitest';
import { formatPrice, formatWeight, formatGoldPrice, isNewArrival, NEW_ARRIVAL_DAYS } from '../utils';

describe('Public Utils', () => {
  describe('formatPrice', () => {
    it('formats price in INR format', () => {
      const formatted = formatPrice(54999);
      expect(formatted).toMatch(/₹\s?54,999/);
    });
  });

  describe('formatWeight', () => {
    it('formats grams with 1 decimal place', () => {
      expect(formatWeight(5.24)).toBe('5.2g');
      expect(formatWeight(10)).toBe('10.0g');
    });
  });

  describe('formatGoldPrice', () => {
    it('formats rate per gram with 2 decimals and currency prefix', () => {
      expect(formatGoldPrice(7250.5)).toMatch(/₹\s?7,250\.50\/gram/);
    });
  });

  describe('isNewArrival', () => {
    it('uses the UTC instant and includes the exact five-day cutoff', () => {
      const now = Date.parse('2026-10-02T12:00:00Z');
      const cutoff = now - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;

      expect(isNewArrival('2026-09-27T17:30:00+05:30', now)).toBe(true);
      expect(isNewArrival(new Date(cutoff - 1).toISOString(), now)).toBe(false);
    });

    it('rejects invalid and future timestamps', () => {
      const now = Date.parse('2026-10-02T12:00:00Z');

      expect(isNewArrival('not-a-date', now)).toBe(false);
      expect(isNewArrival('2026-10-02T12:00:01Z', now)).toBe(false);
    });
  });
});
