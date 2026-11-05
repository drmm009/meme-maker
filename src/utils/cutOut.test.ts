import { describe, it, expect } from 'vitest';
import { canCutOut } from './cutOut';

describe('canCutOut', () => {
  it('cuts out photos and still stickers, not GIFs, videos or text', () => {
    expect(canCutOut({ type: 'image', url: 'blob:x' })).toBe(true);
    expect(canCutOut({ type: 'sticker', url: '/stickers/doge.png' })).toBe(true);
    expect(canCutOut({ type: 'sticker', url: 'https://media.giphy.com/a.gif' })).toBe(false);
    expect(canCutOut({ type: 'sticker', url: 'blob:x', isGif: true })).toBe(false);
    expect(canCutOut({ type: 'video', url: 'blob:x' })).toBe(false);
    expect(canCutOut({ type: 'text' })).toBe(false);
  });
});
