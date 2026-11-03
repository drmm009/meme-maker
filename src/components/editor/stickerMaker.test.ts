import { describe, it, expect } from 'vitest';
import { makeStickerTemplate, stickerExportPrefs, STICKER_PHOTO, STICKER_SIZE } from './stickerMaker';
import { editorModeOf } from './editorModes';

describe('the Stickers maker', () => {
  it('opens on a see-through square with no captions, in the sticker mode', () => {
    const t = makeStickerTemplate();
    expect(t).toMatchObject({ width: STICKER_SIZE, height: STICKER_SIZE, aspectRatio: 1, canvasBgColor: 'transparent', defaultCaptions: [] });
    expect(editorModeOf(t)).toBe('sticker');
  });

  it('exports see-through at 512px, as PNG unless WebP was picked', () => {
    expect(stickerExportPrefs({ format: 'jpeg', quality: 0.9, width: 'full', transparent: false })).toEqual({ format: 'png', quality: 0.9, width: 512, transparent: true });
    expect(stickerExportPrefs({ format: 'webp', quality: 0.8, width: 480 }).format).toBe('webp');
    expect(stickerExportPrefs({ format: 'gif', quality: 0.9, width: 'full' }).format).toBe('png');
  });

  it('sizes a photo to fill most of the square', () => {
    // Photos are drawn fitted into 320px times their scale, on the 1080px canvas.
    expect((320 * STICKER_PHOTO.scale) / 1080).toBeCloseTo(0.85, 1);
  });
});
