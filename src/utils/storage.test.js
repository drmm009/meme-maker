// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { safeGet, safeSet, safeRemove } from './storage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips JSON values', () => {
    expect(safeSet('k', { a: 1 })).toBe(true);
    expect(safeGet('k', null)).toEqual({ a: 1 });
  });

  it('returns fallback for missing keys', () => {
    expect(safeGet('missing', [])).toEqual([]);
  });

  it('returns raw strings that are not JSON', () => {
    localStorage.setItem('raw', 'plain-key-value');
    expect(safeGet('raw', '')).toBe('plain-key-value');
  });

  it('returns raw strings that are not JSON (plain-string keys like API keys)', () => {
    localStorage.setItem('bad', '{not-json');
    expect(safeGet('bad', 'fb')).toBe('{not-json');
  });

  it('safeRemove never throws', () => {
    expect(() => safeRemove('whatever')).not.toThrow();
  });
});
