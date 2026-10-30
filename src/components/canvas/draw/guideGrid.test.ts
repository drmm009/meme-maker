import { describe, it, expect } from 'vitest';
import { guideLines } from './guideGrid';

describe('guide grid', () => {
  it('cuts the image area in thirds and marks its centre', () => {
    const lines = guideLines(0, 100, 900, 600);
    const thirds = lines.filter((l) => l.kind === 'third');
    expect(thirds.map((l) => l.from)).toEqual([[300, 100], [0, 300], [600, 100], [0, 500]]);
    const centres = lines.filter((l) => l.kind === 'centre');
    expect(centres).toEqual([
      { from: [450, 100], to: [450, 700], kind: 'centre' },
      { from: [0, 400], to: [900, 400], kind: 'centre' },
    ]);
  });
});
