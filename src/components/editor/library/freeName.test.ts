import { describe, it, expect } from 'vitest';
import { freeName } from './freeName';

describe('freeName', () => {
  it('keeps a free name and numbers a taken one', () => {
    expect(freeName('Drake', [])).toBe('Drake');
    expect(freeName('Drake', ['Drake'])).toBe('Drake (2)');
    expect(freeName('Drake', ['Drake', 'Drake (2)'])).toBe('Drake (3)');
  });
});
