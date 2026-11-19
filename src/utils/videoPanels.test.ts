import { describe, it, expect } from 'vitest';
import { firstEmptySlot, slotTaken } from './videoPanels';

const slots = [0, 1, 2, 3].map((i) => ({ x: (i % 2) * 400, y: Math.floor(i / 2) * 300, width: 400, height: 300 }));

describe('videoPanels', () => {
  it('counts a clip given to a panel, or anything with its middle there', () => {
    expect(slotTaken(0, slots[0], [{ type: 'video', slotIndex: 0 }])).toBe(true);
    expect(slotTaken(1, slots[1], [{ type: 'sticker', x: 500, y: 100, width: 100, height: 100 }])).toBe(true);
    expect(slotTaken(1, slots[1], [{ type: 'sticker', x: 350, y: 100, width: 40, height: 40 }])).toBe(false);
  });

  it('finds the first empty panel, and none without a grid', () => {
    const items = [{ type: 'image', slotIndex: 0 }, { type: 'sticker', x: 450, y: 50, width: 100, height: 100 }];
    expect(firstEmptySlot(items, slots)).toBe(2);
    expect(firstEmptySlot([], slots.slice(0, 1))).toBeUndefined();
  });
});
