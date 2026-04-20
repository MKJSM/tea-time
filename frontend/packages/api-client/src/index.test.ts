import { describe, it, expect } from 'vitest';
import { apiBase } from './index';

describe('apiBase()', () => {
  it('returns /api for customer scope', () => {
    expect(apiBase('customer')).toBe('/api');
  });

  it('returns /api/admin for admin scope', () => {
    expect(apiBase('admin')).toBe('/api/admin');
  });
});
