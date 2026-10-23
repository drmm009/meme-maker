import { describe, it, expect } from 'vitest';
import { projectFromState, collectBlobUrls, restoreProject } from './videoDraftStore';

describe('videoDraftStore', () => {
  it('keeps only project fields from the editor state', () => {
    const state = { items: [], duration: 7000, canvasAspectRatio: 1, layoutSlots: [], playhead: 900, isPlaying: true, activeItemId: 'x' };
    expect(projectFromState(state)).toEqual({ items: [], duration: 7000, canvasAspectRatio: 1, layoutSlots: [] });
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
});
