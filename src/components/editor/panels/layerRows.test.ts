import { describe, it, expect } from 'vitest';
import { layerRows } from './layerRows';
import type { MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';

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
});
