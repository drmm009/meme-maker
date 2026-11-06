import { describe, it, expect } from 'vitest';
import { inkFor } from './inkFor';

describe('inkFor', () => {
  it('picks dark ink on light canvases and light ink on dark or unknown ones', () => {
    expect(inkFor('#ffffff')).toBe('dark');
    expect(inkFor('#FFE')).toBe('dark');
    expect(inkFor('#000000')).toBe('light');
    expect(inkFor('#1d4ed8')).toBe('light');
    expect(inkFor('linear-gradient(red, blue)')).toBe('light');
    expect(inkFor(undefined)).toBe('light');
  });
});
