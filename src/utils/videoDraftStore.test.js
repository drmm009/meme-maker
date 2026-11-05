import { describe, it, expect } from 'vitest';
import { projectFromState, collectBlobUrls, restoreProject, unusedMedia, videoName, savedVideoMeta } from './videoDraftStore';

describe('videoDraftStore', () => {
  it('keeps only project fields from the editor state', () => {
    const state = { items: [], duration: 7000, canvasAspectRatio: 1, backgroundColor: '#000000', layoutSlots: [], playhead: 900, isPlaying: true, activeItemId: 'x' };
    expect(projectFromState(state)).toEqual({ items: [], duration: 7000, canvasAspectRatio: 1, backgroundColor: '#000000', layoutSlots: [] });
  });

  it('finds the blob URLs a project needs, once each', () => {
    const items = [
      { url: 'blob:http://x/1', thumbnailUrl: 'blob:http://x/2' },
      { url: 'blob:http://x/1' },
      { url: 'https://cdn/clip.mp4', thumbnailUrl: 'data:image/png;base64,AA' },
    ];
    expect(collectBlobUrls(items)).toEqual(['blob:http://x/1', 'blob:http://x/2']);
  });

  it('gives restored files fresh URLs and drops clips whose file is missing', () => {
    const draft = {
      project: {
        duration: 9000,
        items: [
          { id: 'v', type: 'video', url: 'blob:old/1', thumbnailUrl: 'blob:old/2' },
          { id: 'gone', type: 'image', url: 'blob:old/3' },
          { id: 'web', type: 'audio', url: '/sounds/boom.mp3' },
          { id: 't', type: 'text', text: 'hi' },
        ],
      },
    };
    const media = { 'blob:old/1': 'VIDEO', 'blob:old/2': 'THUMB', 'blob:old/3': undefined };
    const project = restoreProject(draft, media, (blob) => `blob:new/${blob}`);
    expect(project.duration).toBe(9000);
    expect(project.items.map((i) => i.id)).toEqual(['v', 'web', 't']);
    expect(project.items[0]).toMatchObject({ url: 'blob:new/VIDEO', thumbnailUrl: 'blob:new/THUMB' });
    expect(project.items[1].url).toBe('/sounds/boom.mp3');
  });

  it('keeps a cut-out picture’s original, and gives it a fresh URL too', () => {
    const items = [{ id: 'p', type: 'image', url: 'blob:old/cut', originalUrl: 'blob:old/photo' }];
    expect(collectBlobUrls(items)).toEqual(['blob:old/cut', 'blob:old/photo']);
    const project = restoreProject({ project: { items } }, { 'blob:old/cut': 'CUT', 'blob:old/photo': 'PHOTO' }, (blob) => `blob:new/${blob}`);
    expect(project.items[0]).toMatchObject({ url: 'blob:new/CUT', originalUrl: 'blob:new/PHOTO' });
  });

  it('keeps files the draft or any saved video still uses', () => {
    const keys = ['blob:a', 'blob:b', 'blob:c', 'blob:d', 42];
    expect(unusedMedia(keys, [['blob:a'], ['blob:b', 'blob:a'], undefined])).toEqual(['blob:c', 'blob:d']);
  });

  it('names a video after its first text, else its first clip', () => {
    expect(videoName([{ type: 'video', name: 'clip.mp4' }, { type: 'text', text: '  when the' + String.fromCharCode(10) + ' code works ' }])).toBe('when the code works');
    expect(videoName([{ type: 'text', text: ' ' }, { type: 'image', name: 'Drake' }])).toBe('Drake');
    expect(videoName([])).toBe('My video');
    expect(videoName([{ type: 'text', text: 'x'.repeat(60) }])).toHaveLength(40);
  });

  it('lists a saved video without its bytes, saying what file it holds', () => {
    const meta = savedVideoMeta({ id: 'v1', name: 'Hi', savedAt: 5, durationMs: 3000, thumbnail: 'data:x', project: { items: [] }, mediaKeys: [], exportBlob: { type: 'video/mp4' } });
    expect(meta).toEqual({ id: 'v1', name: 'Hi', savedAt: 5, durationMs: 3000, thumbnail: 'data:x', exportType: 'video/mp4' });
    expect(savedVideoMeta({ id: 'v2', name: 'x', savedAt: 1, durationMs: 0, thumbnail: '', project: { items: [] }, mediaKeys: [] }).exportType).toBe(null);
  });
});
