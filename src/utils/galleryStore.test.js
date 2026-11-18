import { describe, it, expect } from 'vitest';
import { toMetadata, dataURLToBlob, blobToDataURL, repairStickerThumbnails, opaqueBounds } from './galleryStore';
import { templateNumericId } from './templateOrder';

// 1x1 transparent PNG
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('galleryStore.toMetadata', () => {
  it('keeps state small: thumbnail as imageUrl, no blobs', () => {
    const record = {
      id: 'meme-1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      thumbnailUrl: 'data:image/jpeg;base64,AAA',
      imageBlob: new Blob(['x'], { type: 'image/png' }),
      captions: [{ text: 'hi' }],
    };
    const meta = toMetadata(record);
    expect(meta.id).toBe('meme-1');
    expect(meta.imageUrl).toBe('data:image/jpeg;base64,AAA');
    expect(meta).not.toHaveProperty('imageBlob');
    expect(meta.captions).toEqual([{ text: 'hi' }]);
  });
});

describe('galleryStore.dataURLToBlob and blobToDataURL', () => {
  it('round-trips a PNG dataURL to a Blob and back', async () => {
    const blob = dataURLToBlob(TINY_PNG);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);

    const backToData = await blobToDataURL(blob);
    expect(backToData).toContain('data:image/png;base64,');
  });

  it('handles strings or null gracefully in blobToDataURL', async () => {
    expect(await blobToDataURL(null)).toBe('');
    expect(await blobToDataURL('https://example.com/test.jpg')).toBe('https://example.com/test.jpg');
  });
});

describe('templateNumericId', () => {
  it('prefers trailing digits so string ids sort deterministically', () => {
    expect(templateNumericId({ id: 'imgflip-181913649' })).toBe(181913649);
    expect(templateNumericId({ id: 'custom-12' })).toBe(12);
  });

  it('falls back to trendingScore instead of NaN', () => {
    expect(templateNumericId({ id: 'giphy-abc', trendingScore: 42 })).toBe(42);
    expect(templateNumericId({ id: 'nope' })).toBe(0);
    const sorted = [
      { id: 'giphy-abc', trendingScore: 5 },
      { id: 'imgflip-99', trendingScore: 1 },
    ].sort((a, b) => templateNumericId(b) - templateNumericId(a));
    expect(sorted[0].id).toBe('imgflip-99');
  });
});

describe('galleryStore.repairStickerThumbnails', () => {
  it('leaves memes, and stickers whose full image is a JPEG, alone', async () => {
    const base = { id: 'x', name: 'X', createdAt: '', captions: [], stickers: [], imageLayers: [], rawImageUrl: null };
    const fixed = await repairStickerThumbnails([
      { ...base, id: 'meme', kind: 'meme', thumbnailUrl: 'data:image/jpeg;base64,AAA', imageBlob: dataURLToBlob(TINY_PNG) },
      { ...base, id: 'jpeg', kind: 'sticker', thumbnailUrl: 'data:image/jpeg;base64,AAA', imageBlob: new Blob(['x'], { type: 'image/jpeg' }) },
    ]);
    expect(fixed).toEqual([]);
  });
});

describe('galleryStore.opaqueBounds', () => {
  // A 4x3 picture, see-through but for two pixels: (1,1) and (2,2).
  const pixels = (on) => {
    const data = new Uint8ClampedArray(4 * 3 * 4);
    for (const [x, y] of on) data[(y * 4 + x) * 4 + 3] = 255;
    return data;
  };

  it('finds the box around the visible pixels', () => {
    expect(opaqueBounds(pixels([[1, 1], [2, 2]]), 4, 3)).toEqual({ x: 1, y: 1, w: 2, h: 2 });
  });

  it('is null for a picture with nothing visible', () => {
    expect(opaqueBounds(pixels([]), 4, 3)).toBeNull();
  });
});
