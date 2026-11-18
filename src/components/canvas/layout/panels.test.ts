import { describe, it, expect } from 'vitest';
import { inPanel, panelRects } from './panels';

describe('panelRects', () => {
  it('lays out the preset grids', () => {
    expect(panelRects({ id: '2-vert', slots: 2 })).toEqual([
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ]);
    expect(panelRects({ id: '3-horiz', slots: 3 }).map((r) => r.x)).toEqual([0, 1 / 3, 2 / 3]);
    expect(panelRects({ id: '4-grid', slots: 4 })[3]).toEqual({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
    expect(panelRects({ id: '3-hybrid', slots: 3 })[0]).toEqual({ x: 0, y: 0, width: 1, height: 0.5 });
  });

  it('lays out a custom grid by its columns and rows', () => {
    const rects = panelRects({ id: 'custom-grid', slots: 6, cols: 3, rows: 2 });
    expect(rects).toHaveLength(6);
    expect(rects[4]).toEqual({ x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.5 });
  });

  it('finds whether a point is in a panel', () => {
    const [top] = panelRects({ id: '2-vert', slots: 2 });
    expect(inPanel(top, 0.5, 0.25)).toBe(true);
    expect(inPanel(top, 0.5, 0.75)).toBe(false);
  });
});
