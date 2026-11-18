import { describe, it, expect } from 'vitest';
import { firstEmptyPanel } from './useLayerActions';
import { panelRects } from '../../canvas/layout/panels';
import { WHITE_PIXEL_URL } from '../store/useMemeEditorStore';

describe('firstEmptyPanel', () => {
  // A 3 x 2 custom grid: six panels, no start cards.
  const rects = panelRects({ id: 'custom-grid', slots: 6, cols: 3, rows: 2 });

  it('is the first panel, on an empty grid', () => {
    expect(firstEmptyPanel(rects)).toBe(rects[0]);
  });

  it('skips panels with a photo layer in them, or a panel photo of their own', () => {
    const layers = [{ x: 1 / 6, y: 0.25 }]; // in panel 1
    const slots = [null, 'photo.png', WHITE_PIXEL_URL]; // panel 2 has its own photo; panel 3 is empty
    expect(firstEmptyPanel(rects, layers, slots)).toBe(rects[2]);
  });

  it('is null when every panel has something', () => {
    const layers = rects.map((r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 }));
    expect(firstEmptyPanel(rects, layers)).toBeNull();
  });
});
