import { describe, expect, it } from 'vitest';
import { hasStickerLook, isGifSticker } from './stickerLook';

describe('hasStickerLook', () => {
  it('is a still sticker with a die-cut border or a shadow', () => {
    expect(hasStickerLook({ type: 'sticker', url: 'a.png', dieCut: true })).toBe(true);
    expect(hasStickerLook({ type: 'sticker', url: 'a.png', shadowSize: 4 })).toBe(true);
    expect(hasStickerLook({ type: 'sticker', url: 'a.png', shadowSize: 0 })).toBe(false);
  });

  it('leaves GIFs and other clips as they are', () => {
    expect(hasStickerLook({ type: 'sticker', url: 'a.gif', dieCut: true })).toBe(false);
    expect(hasStickerLook({ type: 'sticker', url: 'blob:x', isGif: true, shadowSize: 8 })).toBe(false);
    expect(hasStickerLook({ type: 'image', url: 'a.png', dieCut: true })).toBe(false);
    expect(isGifSticker({ url: 'https://x/y.GIF?z=1' })).toBe(true);
  });
});
