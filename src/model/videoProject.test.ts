import { describe, it, expect } from 'vitest';
import { VIDEO_PROJECT_VERSION, isClip, migrateVideoProject } from './videoProject';

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

  it('refuses drafts from a newer app version and things that aren\'t projects', () => {
    expect(migrateVideoProject({ items: [video] }, VIDEO_PROJECT_VERSION + 1)).toBeNull();
    expect(migrateVideoProject({ clips: [] })).toBeNull();
    expect(migrateVideoProject('project')).toBeNull();
  });
});
