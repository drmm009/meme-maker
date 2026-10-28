import { describe, it, expect } from 'vitest';
import { GALLERY_RECORD_VERSION, galleryRecord, migrateGalleryRecord } from './galleryRecord';

const meta = { id: 'meme-1', name: 'Mine', createdAt: '2026-10-27T00:00:00.000Z', thumbnailUrl: 'data:image/jpeg;base64,AA', imageBlob: null };
const caption = { id: 'c', x: 0.5, y: 0.2, text: 'TOP TEXT' };

describe('galleryRecord', () => {
  it('stores the editable layers with the current version', () => {
    const record = galleryRecord({ captions: [caption], aspectRatio: '1:1' }, meta);
    expect(record).toMatchObject({ ...meta, version: GALLERY_RECORD_VERSION, captions: [caption], stickers: [], imageLayers: [], rawImageUrl: null, aspectRatio: '1:1' });
  });

  it('reads stickers from the old gallery\'s defaultStickers', () => {
    const sticker = { id: 's', x: 0.1, y: 0.1, emoji: '😂' };
    expect(galleryRecord({ defaultStickers: [sticker] }, meta).stickers).toEqual([sticker]);
  });
});

describe('migrateGalleryRecord', () => {
  it('upgrades memes saved before versioning, making the layer lists arrays', () => {
    const old = { id: 'meme-0', name: 'Old', captions: [caption], stickers: null };
    expect(migrateGalleryRecord(old)).toMatchObject({ id: 'meme-0', version: GALLERY_RECORD_VERSION, captions: [caption], stickers: [], imageLayers: [] });
  });

  it('keeps memes from a newer version as they are', () => {
    const newer = { id: 'meme-9', version: GALLERY_RECORD_VERSION + 1, layers: 'new format' };
    expect(migrateGalleryRecord(newer)).toBe(newer);
  });

  it('skips anything that isn\'t a gallery record', () => {
    expect(migrateGalleryRecord(undefined)).toBeNull();
    expect(migrateGalleryRecord({ name: 'no id' })).toBeNull();
    expect(migrateGalleryRecord('meme')).toBeNull();
  });
});
