import { describe, it, expect } from 'vitest';
import { collageColumns, dealColumns } from './useCollageColumns';

describe('useCollageColumns', () => {
  it('has two columns on a phone and up to five on a wide screen', () => {
    expect([390, 719, 720, 1000, 1400].map(collageColumns)).toEqual([2, 2, 3, 4, 5]);
  });

  it('deals the items across the columns in turn, so the first ones start each column', () => {
    expect(dealColumns([1, 2, 3, 4, 5], 2)).toEqual([[1, 3, 5], [2, 4]]);
    expect(dealColumns([1, 2], 3)).toEqual([[1], [2], []]);
  });
});
