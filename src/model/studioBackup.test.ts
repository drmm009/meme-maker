import { describe, expect, it } from 'vitest';
import { BackupError, BACKUP_VERSION, backupFileName, packBackup, readBackup } from './studioBackup';
import type { StudioBackup } from './studioBackup';
import type { GalleryRecord } from './galleryRecord';
import type { VideoProject } from './videoProject';

const text = async (blob: Blob | null | undefined) => (blob ? new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer())) : null);

const record = (id: string, imageBlob: Blob | null): GalleryRecord => ({
  version: 3,
  kind: 'meme',
  id,
  name: `Meme ${id}`,
  createdAt: '2026-11-19T10:00:00.000Z',
  thumbnailUrl: 'data:image/jpeg;base64,AAAA',
  imageBlob,
  rawImageUrl: null,
  captions: [],
  stickers: [],
  imageLayers: [],
});

const sample = (): StudioBackup => ({
  createdAt: '2026-11-19T10:00:00.000Z',
  gallery: [record('a', new Blob(['picture-a'], { type: 'image/png' })), record('b', null)],
  videos: [{
    id: 'v1',
    version: 5,
    name: 'My video',
    savedAt: 5,
    durationMs: 3000,
    thumbnail: 'data:image/jpeg;base64,BBBB',
    project: { items: [] } as unknown as VideoProject,
    mediaKeys: ['blob:clip-1'],
    exportBlob: new Blob(['exported-mp4'], { type: 'video/mp4' }),
  }],
  media: [{ key: 'blob:clip-1', blob: new Blob(['clip-bytes'], { type: 'video/webm' }) }],
});

describe('studio backup', () => {
  it('reads back what it packed, files and all', async () => {
    const back = await readBackup(packBackup(sample()));
    expect(back.createdAt).toBe('2026-11-19T10:00:00.000Z');
    expect(back.gallery.map((r) => r.id)).toEqual(['a', 'b']);
    expect(await text(back.gallery[0].imageBlob)).toBe('picture-a');
    expect(back.gallery[0].imageBlob?.type).toBe('image/png');
    expect(back.gallery[1].imageBlob).toBeNull();
    expect(back.videos[0].name).toBe('My video');
    expect(await text(back.videos[0].exportBlob)).toBe('exported-mp4');
    expect(back.videos[0].exportBlob?.type).toBe('video/mp4');
    expect(back.media).toHaveLength(1);
    expect(back.media[0].key).toBe('blob:clip-1');
    expect(await text(back.media[0].blob)).toBe('clip-bytes');
  });

  it('packs an empty studio', async () => {
    const back = await readBackup(packBackup({ createdAt: 'x', gallery: [], videos: [], media: [] }));
    expect(back).toEqual({ createdAt: 'x', gallery: [], videos: [], media: [] });
  });

  it('refuses a file that is not a backup', async () => {
    await expect(readBackup(new Blob(['hello there, not a backup']))).rejects.toBeInstanceOf(BackupError);
    await expect(readBackup(new Blob(['x']))).rejects.toThrow('not a Meme Studio backup');
  });

  it('refuses a cut-off backup', async () => {
    const whole = packBackup(sample());
    await expect(readBackup(whole.slice(0, whole.size - 5))).rejects.toThrow('damaged or incomplete');
    await expect(readBackup(whole.slice(0, 30))).rejects.toThrow('damaged or incomplete');
  });

  it('refuses a backup from a newer version', async () => {
    const header = { app: 'MEMESTUDIO', version: BACKUP_VERSION + 1, createdAt: 'x', files: [], gallery: [], videos: [], media: [] };
    const newer = new TextEncoder().encode(JSON.stringify(header));
    const out = new Uint8Array(14 + newer.length);
    out.set(new TextEncoder().encode('MEMESTUDIO'));
    new DataView(out.buffer).setUint32(10, newer.length, true);
    out.set(newer, 14);
    await expect(readBackup(new Blob([out]))).rejects.toThrow('newer version');
  });

  it('names the file by date', () => {
    expect(backupFileName(new Date(2026, 10, 9))).toBe('meme-studio-backup-2026-11-09.memestudio');
  });
});
