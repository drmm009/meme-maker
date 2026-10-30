import { describe, it, expect } from 'vitest';
import { layerRows, drawingRows } from './layerRows';
import type { MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';
import type { ShapeDrawing } from '../../canvas/draw/shapes';

const cap = (id: string, zIndex: number, more: Partial<MemeCaption> = {}) => ({ id, x: 0.5, y: 0.5, text: id.toUpperCase(), zIndex, ...more }) as MemeCaption;

describe('layerRows', () => {
  it('lists every layer, top of the stack first, with its name and state', () => {
    const rows = layerRows(
      [cap('top', 0), cap('card', 3, { isTweetCard: true } as Partial<MemeCaption>)],
      [{ id: 's', x: 0.5, y: 0.5, emoji: '😂', zIndex: 2, hidden: true } as MemeSticker],
      [{ id: 'i', x: 0.5, y: 0.5, zIndex: 1, locked: true } as MemeImageLayer],
    );
    expect(rows.map((r) => [r.id, r.label, r.key])).toEqual([
      ['card', 'Tweet card', 'captions'],
      ['s', '😂', 'stickers'],
      ['i', 'Image 1', 'imageLayers'],
      ['top', 'TOP', 'captions'],
    ]);
    expect(rows[1].hidden).toBe(true);
    expect(rows[2].locked).toBe(true);
  });

  it('uses a custom layerName when set and falls back when blank or unset', () => {
    const named = layerRows(
      [cap('c1', 0, { layerName: 'Punchline' }), cap('c2', 1, { layerName: '   ' })],
      [{ id: 's1', x: 0.5, y: 0.5, emoji: '🔥', zIndex: 2, layerName: 'Flame' } as MemeSticker, { id: 's2', x: 0.5, y: 0.5, emoji: '⭐', zIndex: 3, layerName: '' } as MemeSticker],
      [{ id: 'i1', x: 0.5, y: 0.5, zIndex: 4, layerName: 'Overlay' } as MemeImageLayer, { id: 'i2', x: 0.5, y: 0.5, zIndex: 5, layerName: '  ' } as MemeImageLayer],
    );
    expect(named.map((r) => [r.id, r.label])).toEqual([
      ['i2', 'Image 2'],
      ['i1', 'Overlay'],
      ['s2', '⭐'],
      ['s1', 'Flame'],
      ['c2', 'C2'],
      ['c1', 'Punchline'],
    ]);

    const shapes = drawingRows([
      { id: 'd1', type: 'shape', shape: 'arrow', color: '#fff', size: 4, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], layerName: 'Pointing arrow' } as ShapeDrawing,
      { id: 'd2', type: 'shape', shape: 'rect', color: '#fff', size: 4, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], layerName: '   ' } as ShapeDrawing,
    ]);
    expect(shapes.map((s) => [s.id, s.label])).toEqual([
      ['d2', 'Box'],
      ['d1', 'Pointing arrow'],
    ]);
  });
});
