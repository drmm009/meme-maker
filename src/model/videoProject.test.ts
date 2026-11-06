import { describe, it, expect } from 'vitest';
import { VIDEO_PROJECT_VERSION, clipOpacity, isClip, migrateVideoProject } from './videoProject';

const video = { id: 'v', type: 'video', url: 'blob:x', startMs: 0, endMs: 3000 };
const text = { id: 't', type: 'text', text: 'HI', startMs: 0, endMs: 3000 };

describe('isClip', () => {
  it('accepts clips with a type, id, time range and (unless text) a file', () => {
    expect(isClip(video)).toBe(true);
    expect(isClip(text)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isClip({ ...video, type: 'hologram' })).toBe(false);
    expect(isClip({ ...video, url: undefined })).toBe(false);
    expect(isClip({ ...video, endMs: NaN })).toBe(false);
    expect(isClip({ ...video, id: 7 })).toBe(false);
    expect(isClip(null)).toBe(false);
    expect(isClip([video])).toBe(false);
  });
});

describe('migrateVideoProject', () => {
  it('reads drafts saved before versioning, dropping clips it can\'t use', () => {
    const project = migrateVideoProject({ duration: 9000, items: [video, { id: 'broken', type: 'video' }, text] });
    expect(project?.duration).toBe(9000);
    expect(project?.items.map((i) => i.id)).toEqual(['v', 't']);
  });

  it('reads current drafts as they are', () => {
    expect(migrateVideoProject({ items: [video] }, VIDEO_PROJECT_VERSION)?.items).toEqual([video]);
  });

  it('gives version 1 text the caption look, close to how it looked', () => {
    const old = [
      { ...text, id: 'a', fontSize: 50, outline: 0.1, shadow: 'soft' },
      { ...text, id: 'b', fontSize: 50, shadow: 'glow' },
      { ...text, id: 'c', fontSize: 50, bgColor: 'black', shadow: 'hard' },
    ];
    const [a, b, c] = migrateVideoProject({ items: old }, 1)!.items as unknown as Record<string, unknown>[];
    expect(a).toMatchObject({ stroke: '#000000', strokeWidth: 5, shadowSize: 8, shadowColor: 'rgba(0, 0, 0, 0.8)' });
    expect(a).not.toHaveProperty('outline');
    expect(a).not.toHaveProperty('shadow');
    expect(b).toMatchObject({ stroke: '#000000', strokeWidth: 2, effect: 'glow' });
    expect(c).toMatchObject({ stroke: 'transparent', shadowSize: 4, shadowColor: '#000000' });
    expect(migrateVideoProject({ items: [video] }, 1)?.items).toEqual([video]);
  });

  it('refuses drafts from a newer app version and things that aren\'t projects', () => {
    expect(migrateVideoProject({ items: [video] }, VIDEO_PROJECT_VERSION + 1)).toBeNull();
    expect(migrateVideoProject({ clips: [] })).toBeNull();
    expect(migrateVideoProject('project')).toBeNull();
  });
});

describe('clipOpacity', () => {
  it('is solid when unset or not a number, and kept within 0..1', () => {
    expect(clipOpacity({})).toBe(1);
    expect(clipOpacity({ opacity: Number.NaN })).toBe(1);
    expect(clipOpacity({ opacity: 0.3 })).toBe(0.3);
    expect(clipOpacity({ opacity: 0 })).toBe(0);
    expect(clipOpacity({ opacity: 2 })).toBe(1);
    expect(clipOpacity({ opacity: -1 })).toBe(0);
  });
});
