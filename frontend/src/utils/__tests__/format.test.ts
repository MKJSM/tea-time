import { describe, it, expect } from 'vitest';
import { formatPrice } from '../../utils/format';

describe('formatPrice', () => {
    it('formats whole number with default ₹ symbol', () => {
        expect(formatPrice(100)).toBe('₹100.00');
    });

    it('formats decimal to 2 decimal places', () => {
        expect(formatPrice(3235.5)).toBe('₹3235.50');
    });

    it('formats zero correctly', () => {
        expect(formatPrice(0)).toBe('₹0.00');
    });

    it('formats large amounts', () => {
        expect(formatPrice(50000)).toBe('₹50000.00');
    });

    it('rounds to 2 decimal places', () => {
        expect(formatPrice(10.999)).toBe('₹11.00');
    });
});
