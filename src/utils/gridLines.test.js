import { describe, it, expect } from 'vitest';
import { gridLines } from './gridLines';

describe('gridLines', () => {
  it('splits the canvas into its panels', () => {
    expect(gridLines('2-vert', 800, 450)).toEqual([[0, 225, 800, 225]]);
    expect(gridLines('2-horiz', 800, 450)).toEqual([[400, 0, 400, 450]]);
    expect(gridLines('3-stacked', 600, 300)).toEqual([[0, 100, 600, 100], [0, 200, 600, 200]]);
    expect(gridLines('3-horiz', 600, 300)).toEqual([[200, 0, 200, 300], [400, 0, 400, 300]]);
    expect(gridLines('4-grid', 800, 450)).toEqual([[0, 225, 800, 225], [400, 0, 400, 450]]);
    // One wide panel on top, two below.
    expect(gridLines('3-hybrid', 800, 450)).toEqual([[0, 225, 800, 225], [400, 225, 400, 450]]);
  });

  it('has no lines for one panel, a custom grid or an unknown layout', () => {
    expect(gridLines('1-panel', 800, 450)).toEqual([]);
    expect(gridLines('custom-grid', 800, 450)).toEqual([]);
    expect(gridLines(null, 800, 450)).toEqual([]);
  });
});
