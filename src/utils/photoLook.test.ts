import { describe, expect, it } from 'vitest';
import { blurSubjectUrl, hasPhotoPicture, isPhotoFramed, photoNodeAttrs, photoSceneFunc } from './photoLook';

const photo = { type: 'image', url: 'blob:photo' };

describe('photo look', () => {
  it('has a picture of its own for a filter, or a background blur once its subject is cut from it', () => {
    expect(hasPhotoPicture(photo)).toBe(false);
    expect(hasPhotoPicture({ ...photo, filters: { brightness: 100, contrast: 100, saturation: 100 } })).toBe(false);
    expect(hasPhotoPicture({ ...photo, filters: { brightness: 120 } })).toBe(true);
    expect(hasPhotoPicture({ ...photo, filters: { vignette: 30 } })).toBe(true);
    // A sticker's look is its own (utils/stickerLook).
    expect(hasPhotoPicture({ ...photo, type: 'sticker', filters: { brightness: 120 } })).toBe(false);

    const blurred = { ...photo, bgBlur: 20, subjectUrl: 'blob:subject', subjectOf: 'blob:photo' };
    expect(blurSubjectUrl(blurred)).toBe('blob:subject');
    expect(hasPhotoPicture(blurred)).toBe(true);
    // Cut from a picture the photo no longer shows (replaced, face swapped): no blur until cut again.
    expect(blurSubjectUrl({ ...blurred, url: 'blob:other' })).toBeNull();
    expect(blurSubjectUrl({ ...blurred, bgBlur: 0 })).toBeNull();
  });

  it('draws its frame on the node while it has corners, a border or a shadow', () => {
    expect(isPhotoFramed(photo)).toBe(false);
    expect(photoNodeAttrs(photo)).toEqual({ sceneFunc: undefined, photoLook: undefined });
    for (const look of [{ cornerRadius: 0.2 }, { borderWidth: 4 }, { shadowSize: 10 }]) {
      expect(isPhotoFramed({ ...photo, ...look })).toBe(true);
    }
    const attrs = photoNodeAttrs({ ...photo, borderWidth: 4, borderColor: '#000000' });
    expect(attrs.sceneFunc).toBe(photoSceneFunc);
    expect(attrs.photoLook).toMatchObject({ borderWidth: 4, borderColor: '#000000' });
  });
});
